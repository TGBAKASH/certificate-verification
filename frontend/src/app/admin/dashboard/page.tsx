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
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!account) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Connected: <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">{account.substring(0, 6)}...{account.substring(38)}</span>
          </p>
        </div>
        <div className="flex space-x-4">
          <Link href="/admin/issue" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors whitespace-nowrap">
            + Issue Certificate
          </Link>
          <button onClick={() => { disconnectWallet(); router.push('/admin/login'); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium transition-colors">
            Disconnect
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[50vh]">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
           <h2 className="text-lg font-bold text-slate-900">Issuance History</h2>
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
             {/* Search Bar */}
             <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }} className="flex">
               <input
                 type="text"
                 value={searchInput}
                 onChange={(e) => { setSearchInput(e.target.value); if (e.target.value === '') { setSearch(''); setPage(1); } }}
                 placeholder="Search by name, ID, course..."
                 className="text-sm border border-slate-200 rounded-l px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
               />
               <button type="submit" className="bg-slate-900 text-white text-sm px-3 py-1.5 rounded-r hover:bg-slate-700 transition-colors">Search</button>
             </form>
             {/* Sort Dropdown */}
             <div className="flex items-center space-x-2">
               <label className="text-sm text-slate-600 font-medium">Sort:</label>
               <select 
                 value={sort} 
                 onChange={(e) => setSort(e.target.value as 'asc' | 'desc')}
                 className="text-sm border border-slate-200 rounded p-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
               >
                 <option value="desc">Newest First</option>
                 <option value="asc">Oldest First</option>
               </select>
             </div>
           </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-500">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <svg className="w-12 h-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No certificates issued yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-semibold rounded-tl-lg">Certificate ID</th>
                    <th className="p-4 font-semibold">Student</th>
                    <th className="p-4 font-semibold">Course</th>
                    <th className="p-4 font-semibold">Issue Date</th>
                    <th className="p-4 font-semibold text-right rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((cert) => (
                    <tr key={cert.certificateId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono text-sm text-slate-700">{cert.certificateId}</td>
                      <td className="p-4">
                        <p className="text-sm font-semibold text-slate-900">{cert.studentName}</p>
                        <p className="text-xs text-slate-500">{cert.studentId}</p>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{cert.course}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <Link href={`/verify?id=${cert.certificateId}`} className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold px-3 py-1.5 rounded transition-colors inline-block">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-100">
                <button 
                  disabled={page === 1} 
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-slate-600">
                  Page <span className="font-semibold text-slate-900">{page}</span> of <span className="font-semibold text-slate-900">{totalPages}</span>
                </span>
                <button 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
