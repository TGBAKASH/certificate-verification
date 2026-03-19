"use client";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminLogin() {
  const { account, connectWallet, isConnecting } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (account) {
      router.push("/admin/dashboard");
    }
  }, [account, router]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Admin Access</h2>
        <p className="text-slate-500 mb-8">Connect your wallet to issue and manage certificates.</p>
        
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="w-full flex justify-center items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 px-4 rounded-xl transition-colors disabled:opacity-70"
        >
          {isConnecting ? (
             <span>Connecting...</span>
          ) : (
            <>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12V16C21 20 20 21 16 21H8C4 21 3 20 3 16V8C3 4 4 3 8 3H16M21 12H12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6H21M21 12V6M16 12V10M16 12C16 13.6569 17.3431 15 19 15C19.7432 15 20.4234 14.73 20.9566 14.2882M16 6V8M16 6C16 4.34315 17.3431 3 19 3C19.7432 3 20.4234 3.27 20.9566 3.71175" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Connect MetaMask</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
