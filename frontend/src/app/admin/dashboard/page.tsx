"use client";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from 'next/link';
import axios from 'axios';
import { ethers } from "ethers";
import certArtifact from "@/contracts/CertificateRegistry.json";

export default function AdminDashboard() {
  const { account, disconnectWallet } = useWeb3();
  const router = useRouter();

  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sort, setSort] = useState<'desc' | 'asc'>('desc');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // RBAC State
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [roleCheckFailed, setRoleCheckFailed] = useState(false);

  const [stats, setStats] = useState({ totalCertificates: 0, totalAdmins: 0, todayCertificates: 0 });

  useEffect(() => {
    if (account === null) {
      setIsCheckingRole(false);
      const timer = setTimeout(() => router.push("/admin/login"), 800);
      return () => clearTimeout(timer);
    } else {
      checkRole();
    }
  }, [account]);

  useEffect(() => {
    if (account && !isCheckingRole && (isAdmin || isSuperAdmin)) {
      fetchHistory();
    }
  }, [account, page, sort, search, isAdmin, isSuperAdmin, isCheckingRole]);

  const checkRole = async () => {
    if (!account || !window.ethereum) return;
    setIsCheckingRole(true);
    setRoleCheckFailed(false);
    try {
      try {
        await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
      } catch (err) {
        console.warn('Network switch failed or rejected:', err);
      }
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 11155111) throw new Error('Wrong network');
      const contract = new ethers.Contract(certArtifact.address, certArtifact.abi, provider);
      const sAdmin = await contract.superAdmin();
      const isSA = sAdmin.toLowerCase() === account.toLowerCase();
      setIsSuperAdmin(isSA);
      const adminStatus = await contract.isAdmin(account);
      setIsAdmin(adminStatus);
    } catch (err) {
      console.error("Failed to fetch admin role:", err);
      setRoleCheckFailed(true);
    } finally {
      setIsCheckingRole(false);
    }
  };

  const fetchHistory = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      // Fetch history and stats concurrently
      const [historyRes, statsRes] = await Promise.all([
        axios.get(isSuperAdmin
          ? `${API_URL}/history/all?page=${page}&limit=10&sort=${sort}&search=${encodeURIComponent(search)}`
          : `${API_URL}/history/${account}?page=${page}&limit=10&sort=${sort}&search=${encodeURIComponent(search)}`),
        axios.get(`${API_URL}/dashboard-stats`)
      ]);
      
      setHistory(historyRes.data.certificates);
      setTotalPages(historyRes.data.totalPages || 1);
      setTotalCount(historyRes.data.totalCount || 0);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch history or stats:", err);
    } finally {
      setLoading(false);
    }
  };



  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this certificate record? This removes it from the database, but the hash remains on the blockchain.')) return;
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      await axios.delete(`${API_URL}/certificate/${id}`);
      fetchHistory(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete certificate');
    }
  };

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (!account || isCheckingRole) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center space-x-3 dark:text-slate-400 text-slate-500">
        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span>Verifying authorization...</span>
      </div>
    </div>
  );

  if (roleCheckFailed) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="glass p-10 rounded-2xl border border-yellow-500/20 max-w-lg">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">Network Error</h2>
        <p className="dark:text-slate-400 text-slate-500 mb-2">Could not verify your wallet role on the blockchain.</p>
        <p className="text-slate-500 text-sm mb-6">Make sure your wallet is on the <strong className="text-yellow-400">Sepolia testnet</strong>.</p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button onClick={checkRole} className="btn-primary px-6 py-3 rounded-xl text-sm">Retry</button>
          <button onClick={() => { disconnectWallet(); router.push('/admin/login'); }} className="px-6 py-3 rounded-xl text-sm font-medium dark:text-slate-300 text-slate-700 border dark:border-white/10 border-slate-900/10 hover:dark:bg-white/5 bg-slate-900/5 transition-all">Disconnect & Reconnect</button>
        </div>
      </div>
    </div>
  );

  if (!isAdmin && !isSuperAdmin) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="glass p-10 rounded-2xl border border-red-500/20 max-w-lg">
        <div className="text-5xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold dark:text-white text-slate-900 mb-2">Access Denied</h2>
        <p className="dark:text-slate-400 text-slate-500 mb-6">Your wallet (<span className="font-mono text-xs">{account.substring(0,6)}...{account.substring(38)}</span>) is not authorized.</p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button onClick={() => { disconnectWallet(); router.push('/admin/login'); }} className="px-6 py-3 rounded-xl text-sm font-medium dark:text-slate-300 text-slate-700 border dark:border-white/10 border-slate-900/10 hover:dark:bg-white/5 bg-slate-900/5 transition-all w-full sm:w-auto">Disconnect Wallet</button>
          <Link href="/" className="px-6 py-3 rounded-xl text-sm font-medium text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all w-full sm:w-auto">Go Home</Link>
        </div>
      </div>
    </div>
  );

  // ─── Main Dashboard ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col">
            <h2 className="text-2xl font-bold dark:text-white text-slate-900 flex items-center">
              Admin Dashboard
            </h2>
            <div className="flex flex-wrap items-center mt-2 gap-2 text-sm text-slate-500">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                <span className="font-mono text-xs">{account.substring(0, 6)}...{account.substring(38)}</span>
              </span>
              {isSuperAdmin ? (
                <Link href="/admin/manage" className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ml-2 hover:bg-orange-500/30 transition-colors">SUPER ADMIN</Link>
              ) : isAdmin ? (
                <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-widest ml-2">Admin</span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/issue" className="btn-primary px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2">
              <span>+ Issue Certificate</span>
            </Link>
            <button onClick={() => { disconnectWallet(); router.push('/admin/login'); }} className="px-5 py-2.5 rounded-xl text-sm font-medium dark:text-slate-400 text-slate-500 border dark:border-white/10 border-slate-900/10 hover:dark:bg-white/5 bg-slate-900/5 hover:dark:text-white text-slate-900 transition-all">
              Disconnect
            </button>
          </div>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-5 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
          <div className="text-2xl mb-2">📜</div>
          <div className="text-2xl font-bold dark:text-white text-slate-900">{loading ? '—' : stats.totalCertificates}</div>
          <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Total Issued</div>
        </div>
        <div className="glass rounded-xl p-5 bg-gradient-to-br from-violet-500/20 to-violet-600/10 border border-violet-500/20">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-2xl font-bold dark:text-white text-slate-900">{loading ? '—' : stats.totalAdmins}</div>
          <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Active Admins</div>
        </div>
        <div className="glass rounded-xl p-5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20">
          <div className="text-2xl mb-2">📅</div>
          <div className="text-2xl font-bold dark:text-white text-slate-900">{loading ? '—' : stats.todayCertificates}</div>
          <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">Issued Today</div>
        </div>
      </div>

      {/* History Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b dark:border-white/5 border-slate-900/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-base font-semibold dark:text-white text-slate-900">
            {isSuperAdmin ? 'All Issuance History' : 'My Issuance History'}
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); if (e.target.value === '') { setSearch(''); setPage(1); } }}
                placeholder="Search certificates..."
                className="input-dark text-sm px-3 py-2 rounded-l-lg w-44 dark:text-slate-300 text-slate-700"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 dark:text-white text-slate-900 text-sm px-4 py-2 rounded-r-lg transition-colors font-medium">Search</button>
            </form>
            <select value={sort} onChange={(e) => setSort(e.target.value as 'asc' | 'desc')} className="input-dark text-sm px-3 py-2 rounded-lg dark:text-slate-300 text-slate-700">
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-medium dark:text-slate-400 text-slate-500">{search ? 'No matching certificates' : 'No certificates issued yet'}</p>
            <p className="text-sm mt-1 text-slate-600">{search ? 'Try a different search term' : 'Click "+ Issue Certificate" to get started'}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider bg-white/2">
                    <th className="px-6 py-4 font-semibold">Certificate ID</th>
                    <th className="px-6 py-4 font-semibold">Student</th>
                    <th className="px-6 py-4 font-semibold">Course</th>
                    {isSuperAdmin && <th className="px-6 py-4 font-semibold">Issuer</th>}
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((cert) => (
                    <tr key={cert.certificateId} className="hover:bg-white/2 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-blue-400">{cert.certificateId}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold dark:text-slate-200 text-slate-800">{cert.studentName}</p>
                        <p className="text-xs text-slate-500">{cert.studentId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full">{cert.course}</span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs dark:text-slate-400 text-slate-500">{cert.issuerWallet ? `${cert.issuerWallet.substring(0,6)}...${cert.issuerWallet.substring(38)}` : '—'}</span>
                        </td>
                      )}
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Link href={`/verify?id=${cert.certificateId}`} className="text-xs dark:bg-white/5 bg-slate-900/5 border dark:border-white/10 border-slate-900/10 dark:text-slate-300 text-slate-700 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 px-3 py-1.5 rounded-lg transition-all font-medium">
                          View ↗
                        </Link>
                        {(isSuperAdmin || (cert.issuerWallet && cert.issuerWallet.toLowerCase() === account.toLowerCase())) && (
                          <button 
                            onClick={() => handleDelete(cert.certificateId)}
                            className="text-xs bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 hover:text-red-400 px-3 py-1.5 rounded-lg transition-all font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t dark:border-white/5 border-slate-900/5">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 text-sm font-medium dark:text-slate-400 text-slate-500 border dark:border-white/10 border-slate-900/10 rounded-lg hover:dark:bg-white/5 bg-slate-900/5 hover:dark:text-white text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all">← Previous</button>
                <span className="text-sm text-slate-500">Page <span className="font-semibold dark:text-slate-300 text-slate-700">{page}</span> of <span className="font-semibold dark:text-slate-300 text-slate-700">{totalPages}</span></span>
                <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 text-sm font-medium dark:text-slate-400 text-slate-500 border dark:border-white/10 border-slate-900/10 rounded-lg hover:dark:bg-white/5 bg-slate-900/5 hover:dark:text-white text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
