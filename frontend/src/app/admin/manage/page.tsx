'use client';
import { useState, useEffect } from 'react';
import { useWeb3 } from '@/context/Web3Context';
import { useRouter } from 'next/navigation';
import { ethers } from 'ethers';
import axios from 'axios';
import certArtifact from '../../../contracts/CertificateRegistry.json';
import Link from 'next/link';

interface AdminType {
  _id: string;
  name: string;
  walletAddress: string;
  createdAt: string;
}

export default function ManageAdmins() {
  const { account, signer, disconnectWallet } = useWeb3();
  const router = useRouter();

  const [admins, setAdmins] = useState<AdminType[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminWallet, setNewAdminWallet] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [txMessage, setTxMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    checkRole();
  }, [account, signer]);

  const checkRole = async () => {
    if (!account || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(certArtifact.address, certArtifact.abi, provider);
      
      const sAdmin = await contract.superAdmin();
      setIsSuperAdmin(sAdmin.toLowerCase() === account.toLowerCase());
      
      if (sAdmin.toLowerCase() === account.toLowerCase()) {
        fetchAdmins();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Role verification failed:", err);
      setIsSuperAdmin(false);
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await axios.get(`${API_URL}/admins`);
      setAdmins(res.data);
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !newAdminWallet || !newAdminName) return;
    
    setTxLoading(true);
    setTxMessage({ text: 'Waiting for blockchain confirmation...', type: 'info' });
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contractSigner = await provider.getSigner();
      const contract = new ethers.Contract(certArtifact.address, certArtifact.abi, contractSigner);
      
      // 1. Send transaction to add admin on blockchain
      const tx = await contract.addAdmin(newAdminWallet);
      setTxMessage({ text: 'Transaction submitted. Waiting for confirmation...', type: 'info' });
      await tx.wait();
      
      // 2. Save admin to database
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      await axios.post(`${API_URL}/admins`, { name: newAdminName, walletAddress: newAdminWallet });
      
      setTxMessage({ text: '✅ Admin successfully added!', type: 'success' });
      setNewAdminName('');
      setNewAdminWallet('');
      fetchAdmins();
    } catch (err: any) {
      setTxMessage({ text: err.reason || err.response?.data?.error || err.message || 'Transaction failed', type: 'error' });
    } finally {
      setTxLoading(false);
    }
  };

  const handleRemoveAdmin = async (walletAddress: string) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Are you sure you want to remove admin privileges for ${walletAddress}?`)) return;

    setTxLoading(true);
    setTxMessage({ text: `Removing ${walletAddress.substring(0,6)}...`, type: 'info' });
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contractSigner = await provider.getSigner();
      const contract = new ethers.Contract(certArtifact.address, certArtifact.abi, contractSigner);
      
      // 1. Send transaction to remove admin on blockchain
      const tx = await contract.removeAdmin(walletAddress);
      setTxMessage({ text: 'Transaction submitted. Waiting for confirmation...', type: 'info' });
      await tx.wait();
      
      // 2. Remove admin from database
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      await axios.delete(`${API_URL}/admins/${walletAddress}`);
      
      setTxMessage({ text: '✅ Admin successfully removed!', type: 'success' });
      fetchAdmins();
    } catch (err: any) {
      setTxMessage({ text: err.reason || err.message || 'Transaction failed', type: 'error' });
    } finally {
      setTxLoading(false);
    }
  };

  if (isSuperAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 dark:text-slate-400 text-slate-500">
          <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
          <span>Verifying Super Admin authorization...</span>
        </div>
      </div>
    );
  }

  if (isSuperAdmin === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="glass p-10 rounded-2xl border border-red-500/20 max-w-lg">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">Access Denied</h2>
          <p className="dark:text-slate-400 text-slate-500 mb-6">Only the Super Admin can manage other admins.</p>
          <Link href="/admin/dashboard" className="btn-primary px-6 py-3 rounded-xl text-sm">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-white text-slate-900">Manage Admins</h1>
          <p className="dark:text-slate-500 text-slate-600 text-sm mt-1">Add or revoke permissions for issuing certificates</p>
        </div>
        <Link href="/admin/dashboard" className="text-sm dark:text-slate-400 text-slate-500 hover:dark:text-white hover:text-slate-900 border dark:border-white/10 border-slate-900/10 hover:dark:bg-white/5 bg-slate-900/5 px-4 py-2 rounded-lg transition-all">
          ← Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Admin Form */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl p-6 border dark:border-white/5 border-slate-900/5 sticky top-8">
            <h2 className="text-lg font-bold dark:text-white text-slate-900 mb-6 flex items-center gap-2">
              <span className="text-green-500">➕</span> Add New Admin
            </h2>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">Admin Name</label>
                <input 
                  required 
                  type="text" 
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  value={newAdminName} 
                  onChange={e => setNewAdminName(e.target.value)} 
                  placeholder="e.g. Professor Smith" 
                  disabled={txLoading}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider mb-2">Wallet Address</label>
                <input 
                  required 
                  type="text" 
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm font-mono"
                  value={newAdminWallet} 
                  onChange={e => setNewAdminWallet(e.target.value)} 
                  placeholder="0x..." 
                  disabled={txLoading}
                />
              </div>

              {txMessage.text && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  txMessage.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-500' :
                  txMessage.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-500' :
                  'bg-blue-500/10 border border-blue-500/20 text-blue-500'
                }`}>
                  {txMessage.type === 'info' && <div className="w-3 h-3 mt-0.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />}
                  <span>{txMessage.text}</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={txLoading || !newAdminWallet || newAdminWallet.length !== 42 || !newAdminName} 
                className={`w-full py-3.5 rounded-xl text-sm font-bold shadow-lg transition-all ${
                  txLoading || !newAdminWallet || newAdminWallet.length !== 42 || !newAdminName
                    ? 'bg-slate-900/50 dark:bg-white/5 text-slate-500 cursor-not-allowed border outline-none border-white/5' 
                    : 'bg-green-500 hover:bg-green-400 text-slate-900 shadow-green-500/20'
                }`}
              >
                {txLoading ? 'Processing...' : 'Authorize Admin'}
              </button>
            </form>
          </div>
        </div>

        {/* Admins List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold dark:text-white text-slate-900 flex items-center gap-2 mb-2">
            <span className="text-blue-500">👥</span> Authorized Admins
          </h2>
          {loading ? (
             <div className="glass rounded-2xl p-8 border dark:border-white/5 border-slate-900/5 flex items-center justify-center">
               <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
             </div>
          ) : admins.length === 0 ? (
            <div className="glass rounded-2xl p-8 border dark:border-white/5 border-slate-900/5 text-center text-slate-500 text-sm">
              No admins authorized yet. Add some on the left.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {admins.map((admin) => (
                <div key={admin._id} className="glass rounded-xl p-4 border dark:border-white/5 border-slate-900/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-white/2">
                  <div>
                    <h3 className="font-bold dark:text-white text-slate-900">{admin.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs dark:text-slate-400 text-slate-500 bg-slate-900/5 dark:bg-white/5 px-2 py-0.5 rounded border dark:border-white/5 border-slate-900/5">
                        {admin.walletAddress}
                      </span>
                      <span className="text-[10px] text-slate-500">Added {new Date(admin.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveAdmin(admin.walletAddress)}
                    disabled={txLoading || account.toLowerCase() === admin.walletAddress.toLowerCase()}
                    className="self-start sm:self-center px-4 py-2 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all disabled:opacity-50"
                  >
                    Revoke Access
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
