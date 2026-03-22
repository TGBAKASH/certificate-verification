const Admin = require('../models/Admin');
const Certificate = require('../models/Certificate');
const { ethers } = require('ethers');

let contractData = { address: '', abi: [] };
try {
  contractData = require('../../contracts/CertificateRegistry.json');
} catch (e) {
  console.warn('Contract ABI not found in adminController.');
}

exports.getAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addAdmin = async (req, res) => {
  try {
    const { name, walletAddress } = req.body;
    if (!name || !walletAddress) {
      return res.status(400).json({ error: 'Name and wallet address are required' });
    }
    const newAdmin = new Admin({ name, walletAddress: walletAddress.toLowerCase() });
    await newAdmin.save();
    res.status(201).json(newAdmin);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Admin already exists' });
    }
    res.status(500).json({ error: err.message });
  }
};

exports.removeAdmin = async (req, res) => {
  try {
    const { wallet } = req.params;
    await Admin.findOneAndDelete({ walletAddress: wallet.toLowerCase() });
    res.json({ success: true, message: 'Admin removed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalAdmins = await Admin.countDocuments();
    const totalCertificates = await Certificate.countDocuments();

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCertificates = await Certificate.countDocuments({
      issueDate: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({ totalAdmins, totalCertificates, todayCertificates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Read AdminAdded events from blockchain to find all admins ever added on-chain
// Then register any not yet in MongoDB with a default name
exports.syncAdmins = async (req, res) => {
  try {
    const { superAdminWallet, defaultName } = req.body;

    const rpcUrl = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
    if (!contractData.address || !contractData.abi.length) {
      return res.status(500).json({ error: 'Contract not configured' });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractData.address, contractData.abi, provider);

    // Query all AdminAdded events from contract deployment to now
    const addedEvents = await contract.queryFilter(contract.filters.AdminAdded(), 0, 'latest');
    const removedEvents = await contract.queryFilter(contract.filters.AdminRemoved(), 0, 'latest');

    // Build a set of removed wallets so we exclude them
    const removedSet = new Set(removedEvents.map(e => e.args[0].toLowerCase()));

    const inserted = [];
    for (const event of addedEvents) {
      const wallet = event.args[0].toLowerCase();

      // Skip if subsequently removed
      if (removedSet.has(wallet)) continue;
      // Skip super admin
      if (superAdminWallet && wallet === superAdminWallet.toLowerCase()) continue;
      // Skip if already in DB
      const exists = await Admin.findOne({ walletAddress: wallet });
      if (exists) continue;

      const newAdmin = new Admin({ walletAddress: wallet, name: defaultName || 'Wlt 1' });
      await newAdmin.save();
      inserted.push(wallet);
    }

    res.json({ inserted, message: `${inserted.length} admin(s) synced from blockchain events.` });
  } catch (err) {
    console.error('syncAdmins error:', err);
    res.status(500).json({ error: err.message });
  }
};
