const Admin = require('../models/Admin');
const Certificate = require('../models/Certificate');

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
    const totalAdminsInDB = await Admin.countDocuments();
    const totalCertificates = await Certificate.countDocuments();
    
    // Get today's start and end date
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCertificates = await Certificate.countDocuments({
      issueDate: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({
      totalAdmins: totalAdminsInDB + 1, // +1 for the super admin (stored on-chain, not in DB)
      totalCertificates,
      todayCertificates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
