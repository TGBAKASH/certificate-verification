"use client";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from 'next/link';

export default function AdminDashboard() {
  const { account, disconnectWallet } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (account === null) {
      // Check if actually null without wallet, but context might take a moment.
      // We will allow a brief flash, but usually this is protected via layouts.
      const timer = setTimeout(() => {
        if (!window.ethereum?.selectedAddress) {
          router.push("/admin/login");
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [account, router]);

  if (!account) return <div className="text-center mt-20">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Connected: <span className="font-mono bg-slate-100 px-2 py-1 rounded text-slate-700">{account.substring(0, 6)}...{account.substring(38)}</span>
          </p>
        </div>
        <div className="flex space-x-4">
          <Link href="/admin/issue" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">
            + Issue Certificate
          </Link>
          <button onClick={() => { disconnectWallet(); router.push('/admin/login'); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg font-medium transition-colors">
            Disconnect
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[50vh] flex flex-col items-center justify-center text-slate-500">
        <svg className="w-16 h-16 mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg">Welcome to the issuing portal.</p>
        <p className="text-sm mt-2 max-w-md text-center">Use the Issue Certificate button above to create a new digital certificate backed by the Ethereum blockchain.</p>
      </div>
    </div>
  );
}
