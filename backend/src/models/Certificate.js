const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema({
  certificateId: { type: String, required: true, unique: true },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  studentId: { type: String, required: true },
  course: { type: String, required: true },
  filePath: { type: String }, // e.g. path to PDF if stored locally/IPFS
  fileData: { type: Buffer }, // Store PDF/Image directly in MongoDB
  fileContentType: { type: String }, // e.g. 'application/pdf'
  issueDate: { type: Date, default: Date.now },
  blockchainHash: { type: String, required: true }, 
  issuerWallet: { type: String, required: true },
  transactionHash: { type: String } // from smart contract tx
}, { timestamps: true });

module.exports = mongoose.model('Certificate', CertificateSchema);
