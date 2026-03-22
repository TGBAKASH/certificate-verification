"use client";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminLogin() {
  const { account, connectWallet, isConnecting } = useWeb3();
  const router = useRouter();
  const [switchingWallet, setSwitchingWallet] = useState(false);

  useEffect(() => {
    if (account) {
      router.push("/admin/dashboard");
    }
  }, [account, router]);

  const handleSwitchWallet = async () => {
    if (!window.ethereum) return;
    setSwitchingWallet(true);
    try {
      // This shows ALL MetaMask accounts (connected and unconnected)
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
      // After selection, connect wallet normally
      await connectWallet(false);
    } catch (err) {
      console.log("Wallet switch cancelled");
    } finally {
      setSwitchingWallet(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        {/* Top badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold px-4 py-2 rounded-full mb-6">
            <span>🔐</span>
            <span>Secure Admin Access</span>
          </div>
          <h1 className="text-3xl font-bold dark:text-white text-slate-900 mb-2">Admin Portal</h1>
          <p className="dark:text-slate-400 text-slate-500 text-sm">Connect your wallet to issue and manage blockchain certificates</p>
        </div>

        {/* Glass Card */}
        <div className="glass rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-card), 0 0 60px rgba(139, 92, 246, 0.1)' }}>
          {/* Metamask icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-10 h-10 dark:text-white text-slate-900" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
              </svg>
            </div>
          </div>

          <h2 className="text-center text-lg font-semibold dark:text-white text-slate-900 mb-1">Connect MetaMask</h2>
          <p className="text-center text-slate-500 text-sm mb-6">Make sure you're on the Sepolia testnet</p>

          {/* Primary: Connect the currently selected MetaMask wallet */}
          <button
            onClick={() => connectWallet(false)}
            disabled={isConnecting || switchingWallet}
            className="btn-primary w-full py-4 px-6 rounded-xl text-sm flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Connect Wallet</span>
              </>
            )}
          </button>

          {/* Secondary: Switch to a different wallet */}
          <button
            onClick={handleSwitchWallet}
            disabled={isConnecting || switchingWallet}
            className="w-full mt-3 py-3 px-6 rounded-xl text-sm font-medium dark:text-slate-400 text-slate-500 border dark:border-white/10 border-slate-900/10 hover:dark:bg-white/5 bg-slate-900/5 hover:dark:text-white text-slate-900 transition-all disabled:opacity-40"
          >
            {switchingWallet ? "Opening MetaMask..." : "🔄 Use a Different Wallet"}
          </button>

          <div className="mt-6 pt-6 border-t dark:border-white/5 border-slate-900/5">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 mt-0.5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <p className="text-xs text-slate-500">Only authorized admin wallets can access this panel. Your wallet is verified on-chain.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

