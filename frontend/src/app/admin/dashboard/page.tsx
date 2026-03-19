"use client";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from 'next/link';
import axios from 'axios';

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

  useEffect(() => {
    if (account === null) {
      const timer = setTimeout(() => {
        if (!window.ethereum?.selectedAddress) {
          router.push("/admin/login");
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      fetchHistory();
    }
  }, [account, router, page, sort, search]);

  const fetchHistory = async () => {
    if (!account) return;
    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await axios.get(`${API_URL}/history/${account}?page=${page}&limit=10&sort=${sort}&search=${encodeURIComponent(search)}`);
      setHistory(res.data.certificates);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!account) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center space-x-3 text-slate-400">
        <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <p className="text-slate-400 text-sm font-mono">{account.substring(0, 6)}...{account.substring(38)}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/issue" className="btn-primary px-5 py-2.5 rounded-xl text-sm inline-flex items-center space-x-2">
            <span>+</span>
            <span>Issue Certificate</span>
          </Link>
          <button 
            onClick={() => { disconnectWallet(); router.push('/admin/login'); }} 
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Issued', value: totalCount, icon: '📜', color: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/20' },
          { label: 'Network', value: 'Sepolia', icon: '⛓️', color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/20' },
          { label: 'Status', value: 'Active', icon: '✅', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`glass rounded-xl p-5 bg-gradient-to-br ${stat.color} border ${stat.border}`}>
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{loading && stat.label === 'Total Issued' ? '—' : stat.value}</div>
            <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* History Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {/* Table Header w/ Search & Sort */}
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-base font-semibold text-white">Issuance History</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); if (e.target.value === '') { setSearch(''); setPage(1); } }}
                placeholder="Search certificates..."
                className="input-dark text-sm px-3 py-2 rounded-l-lg w-44 text-slate-300"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-r-lg transition-colors font-medium">
                Search
              </button>
            </form>
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}
              className="input-dark text-sm px-3 py-2 rounded-lg text-slate-300"
            >
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
            <p className="font-medium text-slate-400">{search ? 'No matching certificates found' : 'No certificates issued yet'}</p>
            <p className="text-sm mt-1 text-slate-600">{search ? 'Try a different search term' : 'Click "Issue Certificate" to get started'}</p>
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
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {history.map((cert) => (
                    <tr key={cert.certificateId} className="table-row transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-blue-400">{cert.certificateId}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-200">{cert.studentName}</p>
                        <p className="text-xs text-slate-500">{cert.studentId}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-1 rounded-full">{cert.course}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(cert.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/verify?id=${cert.certificateId}`} className="text-xs bg-white/5 border border-white/10 text-slate-300 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 px-3 py-1.5 rounded-lg transition-all font-medium">
                          View ↗
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-white/5">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <span className="text-sm text-slate-500">
                  Page <span className="font-semibold text-slate-300">{page}</span> of <span className="font-semibold text-slate-300">{totalPages}</span>
                </span>
                <button 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 border border-white/10 rounded-lg hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


