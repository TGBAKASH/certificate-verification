"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import QRCode from "react-qr-code";

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const certId = searchParams.get("id") as string;
  
  const [certData, setCertData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<"IDLE" | "VERIFYING" | "VALID" | "INVALID">("IDLE");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [verifyData, setVerifyData] = useState<any>(null);
  const [fileToVerify, setFileToVerify] = useState<File | null>(null);

  useEffect(() => {
    fetchCertificateData();
  }, [certId]);

  const fetchCertificateData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await axios.get(`${API_URL}/certificate/${certId}`);
      setCertData(res.data);
      verifyAgainstBlockchain(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Certificate not found in database.");
      setLoading(false);
    }
  };

  const verifyAgainstBlockchain = async (file: File | null) => {
    setVerifyStatus("VERIFYING");
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const formData = new FormData();
      formData.append("certificateId", certId);
      if (file) formData.append("document", file);
      const res = await axios.post(`${API_URL}/verify`, formData);
      if (res.data.valid) {
        setVerifyStatus("VALID");
        setVerifyData(res.data.data);
      } else {
        setVerifyStatus("INVALID");
        setVerifyMessage(res.data.message);
      }
    } catch (err: any) {
      setVerifyStatus("INVALID");
      setVerifyMessage(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerification = (e: React.FormEvent) => {
    e.preventDefault();
    verifyAgainstBlockchain(fileToVerify);
  };

  if (loading && !certData) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Fetching certificate from blockchain...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="glass rounded-2xl p-10">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">Certificate Not Found</h1>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <Link href="/" className="btn-primary px-6 py-3 rounded-xl text-sm inline-block">
            Try Another ID
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm inline-flex items-center space-x-1 transition-colors">
          <span>←</span> <span>Back to Search</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Status + QR */}
        <div className="lg:col-span-1 space-y-4">
          {/* Status Card */}
          <div className={`glass rounded-2xl p-6 text-center border transition-all ${
            verifyStatus === 'VERIFYING' ? 'border-amber-500/30' :
            verifyStatus === 'VALID' ? 'border-green-500/30' :
            verifyStatus === 'INVALID' ? 'border-red-500/40' : 'border-white/8'
          }`} style={{
            boxShadow: verifyStatus === 'VALID' ? '0 0 40px rgba(16,185,129,0.08)' :
              verifyStatus === 'INVALID' ? '0 0 40px rgba(239,68,68,0.08)' : 'var(--shadow-card)'
          }}>
            {verifyStatus === 'VERIFYING' && (
              <div className="py-6">
                <div className="w-14 h-14 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-base font-bold text-amber-400">Verifying...</h3>
                <p className="text-xs text-amber-600 mt-1">Checking blockchain records</p>
              </div>
            )}
            {verifyStatus === 'VALID' && (
              <div className="py-6">
                <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-4 animate-pulse-green">
                  <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-green-400 uppercase tracking-wider">Valid</h2>
                <p className="text-green-600 text-xs mt-1">Verified by Ethereum</p>
                {verifyData?.onchainTimestamp && (
                  <div className="mt-4 pt-4 border-t border-green-500/20 text-left">
                    <p className="text-xs text-green-700 uppercase font-semibold mb-1">On-Chain Time</p>
                    <p className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-1.5 rounded">
                      {new Date(Number(verifyData.onchainTimestamp) * 1000).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
            {verifyStatus === 'INVALID' && (
              <div className="py-6">
                <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4 animate-pulse-red">
                  <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-red-400 uppercase tracking-wider">Invalid</h2>
                <p className="text-xs text-red-600 mt-3 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-left">{verifyMessage}</p>
              </div>
            )}
          </div>

          {/* QR Card */}
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">Share Verification Link</p>
            <div className="bg-white p-3 rounded-xl inline-block mb-3">
              <QRCode value={typeof window !== "undefined" ? window.location.href : ""} size={110} />
            </div>
            <div className="flex gap-2">
              <input type="text" readOnly value={typeof window !== "undefined" ? window.location.href : ""} className="flex-1 text-xs text-slate-500 bg-white/5 border border-white/10 py-2 px-2 rounded-l-lg focus:outline-none" />
              <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-r-lg transition-colors whitespace-nowrap">
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Right: Certificate Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass rounded-2xl p-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white">Certificate Details</h3>
              <span className="text-xs text-slate-500 font-mono bg-white/5 px-3 py-1 rounded-full">{certId}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Student Name</p>
                <p className="text-xl font-bold text-white">{certData.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Student ID</p>
                <p className="text-lg font-semibold text-slate-300">{certData.studentId}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Course / Program</p>
                <span className="text-sm bg-violet-500/10 border border-violet-500/20 text-violet-400 px-4 py-1.5 rounded-full inline-block">{certData.course}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Issued On</p>
                <p className="text-slate-300">{new Date(certData.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Issuer Wallet</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-xs text-slate-500 bg-white/5 border border-white/5 p-2 rounded break-all whitespace-normal">
                    {certData.issuerWallet}
                  </p>
                  {(process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase() === certData.issuerWallet.toLowerCase() || 
                    certData.issuerWallet.toLowerCase() === "0x5f2549d4d1802c2bdd2018759cf7243c12da3488") && (
                    <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] px-2 py-1 rounded-md tracking-widest uppercase font-bold whitespace-nowrap">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">SHA-256 Hash</p>
                <p className="font-mono text-xs text-slate-500 bg-white/5 border border-white/5 p-3 rounded break-all">{certData.blockchainHash}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Blockchain Transaction</p>
                <a href={`https://sepolia.etherscan.io/tx/${certData.transactionHash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-blue-400 hover:text-blue-300 break-all hover:underline transition-colors">
                  {certData.transactionHash} ↗
                </a>
              </div>
            </div>
          </div>

          {/* Document Verify */}
          <div className="glass rounded-2xl p-6">
            <h4 className="font-semibold text-white text-sm flex items-center mb-1">
              <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verify with Original Document
            </h4>
            <p className="text-xs text-slate-500 mb-4">Upload the original certificate to compare its cryptographic fingerprint against the blockchain record.</p>
            <form onSubmit={handleManualVerification} className="flex flex-col sm:flex-row items-end gap-3">
              <label className="flex-1 flex items-center space-x-3 input-dark px-4 py-3 rounded-xl cursor-pointer hover:border-blue-500/40 transition-colors">
                <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-xs text-slate-400">{fileToVerify ? fileToVerify.name : "Choose PDF or Image..."}</span>
                <input type="file" required accept="application/pdf,image/*" onChange={(e) => setFileToVerify(e.target.files ? e.target.files[0] : null)} className="hidden" />
              </label>
              <button type="submit" disabled={verifyStatus === 'VERIFYING'} className="btn-primary px-5 py-3 rounded-xl text-sm whitespace-nowrap disabled:opacity-60">
                {verifyStatus === 'VERIFYING' ? 'Checking...' : 'Check Document'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyCertificate() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    }>
      <VerifyCertificateContent />
    </Suspense>
  );
}
