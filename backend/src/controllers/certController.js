const crypto = require('crypto');
const fs = require('fs');
const Certificate = require('../models/Certificate');
const ethers = require('ethers');

// Need the smart contract ABI and address (this is generated dynamically when contract deploys)
// For local testing, we might need a dummy config if not available yet.
let contractData = { address: "", abi: [] };
try {
  contractData = require('../../contracts/CertificateRegistry.json');
} catch (e) {
  console.warn("Contract ABI not found. Ensure contract is deployed.");
}

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const generateHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return '0x' + hashSum.digest('hex');
};

exports.uploadAndHash = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const hash = generateHash(filePath);

    res.json({
      filePath: filePath,
      hash: hash
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.issueCertificate = async (req, res) => {
  try {
    const { certificateId, studentName, studentEmail, studentId, course, filePath, blockchainHash, issuerWallet, transactionHash } = req.body;

    // Validate required fields
    if (!certificateId || !studentName || !studentEmail || !studentId || !course || !issuerWallet) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existingCert = await Certificate.findOne({ certificateId });
    if (existingCert) {
      return res.status(400).json({ error: 'Certificate ID already exists' });
    }

    const newCert = new Certificate({
      certificateId,
      studentName,
      studentEmail,
      studentId,
      course,
      filePath,
      blockchainHash,
      issuerWallet,
      transactionHash
    });

    await newCert.save();

    res.status(201).json(newCert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ certificateId: req.params.id });
    if (!cert) return res.status(404).json({ error: 'Certificate not found in DB' });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { issuerWallet } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sort = req.query.sort === 'asc' ? 1 : -1;
    const search = req.query.search || '';

    const baseQuery = issuerWallet.toLowerCase() === 'all' 
      ? {} 
      : { issuerWallet: { $regex: new RegExp(`^${issuerWallet}$`, "i") } };

    const searchQuery = search 
      ? {
          ...baseQuery,
          $or: [
            { studentName: { $regex: search, $options: 'i' } },
            { studentId: { $regex: search, $options: 'i' } },
            { course: { $regex: search, $options: 'i' } },
            { certificateId: { $regex: search, $options: 'i' } }
          ]
        }
      : baseQuery;

    const total = await Certificate.countDocuments(searchQuery);
    const certificates = await Certificate.find(searchQuery)
      .sort({ issueDate: sort })
      .skip(skip)
      .limit(limit);

    res.json({
      certificates,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalCount: total
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyCertificate = async (req, res) => {
  try {
    const { certificateId } = req.body;
    
    // 1. Fetch from DB
    const certDB = await Certificate.findOne({ certificateId });
    if (!certDB) return res.status(404).json({ valid: false, message: 'Certificate not found in records' });

    let calculatedHash = certDB.blockchainHash;

    // 2. If a file is uploaded during verification, check if it matches the hash exactly
    if (req.file) {
      calculatedHash = generateHash(req.file.path);
      fs.unlinkSync(req.file.path);
      
      if (calculatedHash !== certDB.blockchainHash) {
         return res.json({ valid: false, message: 'Document has been altered or tampered with. The cryptographic hash does not match the blockchain record.' });
      }
    }

    // 3. Verify on Blockchain using Sepolia RPC (public node fallback)
    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    if (!contractData.address) return res.status(500).json({ error: "Smart contract not deployed. Missing contract address in artifacts." });
    
    const contract = new ethers.Contract(contractData.address, contractData.abi, provider);
    
    // contract.verifyCertificate returns (certificateHash, issuer, timestamp)
    const [onchainHash, onchainIssuer, onchainTimestamp] = await contract.verifyCertificate(certificateId);

    if (onchainHash !== calculatedHash) {
      return res.json({ valid: false, message: 'Hash mismatch — certificate record on blockchain does not match.' });
    }

    res.json({
      valid: true,
      message: 'VALID CERTIFICATE',
      data: {
        studentName: certDB.studentName,
        course: certDB.course,
        issuerWallet: onchainIssuer,
        issueDate: certDB.issueDate,
        transactionHash: certDB.transactionHash,
        onchainTimestamp: onchainTimestamp.toString()
      }
    });

  } catch (err) {
    if (err.message && err.message.includes("Certificate not found")) {
      return res.json({ valid: false, message: 'Certificate ID was not found on the Ethereum blockchain. It may have been issued on a different network.' });
    }
    console.error("Verify error:", err);
    res.status(500).json({ error: err.message });
  }
};
