"use client";
import { useState, useEffect } from "react";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import axios from "axios";
import QRCode from "react-qr-code";
import Link from "next/link";
import certArtifact from "@/contracts/CertificateRegistry.json";

export default function IssueCertificate() {
  const { account, signer, disconnectWallet } = useWeb3();
  const router = useRouter();

  const [formData, setFormData] = useState({ studentName: "", studentEmail: "", studentId: "", course: "", certificateTitle: "" });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [issuedCert, setIssuedCert] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdminRole();
  }, [account, signer]);

  const checkAdminRole = async () => {
    if (!account || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const contract = new ethers.Contract(certArtifact.address, certArtifact.abi, provider);
      
      const sAdmin = await contract.superAdmin();
      const adminStatus = await contract.isAdmin(account);
      
      setIsAdmin(sAdmin.toLowerCase() === account.toLowerCase() || adminStatus);
    } catch (err) {
      console.error("Role verification failed:", err);
      setIsAdmin(false);
    }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !signer) { alert("Please connect your wallet account"); return; }
    if (!file) { alert("Please upload a certificate PDF"); return; }

    setLoading(true);
    setIsError(false);
    setStatusMsg("Uploading document and generating hash...");

    try {
      const uploadData = new FormData();
      uploadData.append("document", file);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const uploadRes = await axios.post(`${API_URL}/upload`, uploadData);
      const docHash = uploadRes.data.hash;
      const filePath = uploadRes.data.filePath;

      setStatusMsg("Waiting for blockchain confirmation... Please approve the transaction in your wallet.");
      const contract = new ethers.Contract(certArtifact.address, certArtifact.abi, signer);
      const certId = `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const tx = await contract.issueCertificate(certId, docHash);
      setStatusMsg("Transaction submitted. Waiting for mining...");
      const receipt = await tx.wait();

      setStatusMsg("Saving records to database...");
      const metadata = {
        certificateId: certId,
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        studentId: formData.studentId,
        course: formData.course,
        certificateTitle: formData.certificateTitle,
        filePath,
        blockchainHash: docHash,
        issuerWallet: account,
        transactionHash: receipt.hash
      };

      await axios.post(`${API_URL}/issue-certificate`, metadata);
      setIssuedCert({ ...metadata, verifyUrl: `${window.location.origin}/verify?id=${certId}` });
      setStatusMsg("Certificate issued successfully!");
    } catch (err: any) {
      setIsError(true);
      setStatusMsg(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Unauthorized</h2>
        <p className="text-slate-400 mb-6">Please connect your wallet to access this page.</p>
        <Link href="/admin/login" className="btn-primary px-6 py-3 rounded-xl text-sm">Go to Login</Link>
      </div>
    );
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
         <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
         <p className="text-slate-400">Verifying authorization...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="glass p-10 rounded-2xl border border-red-500/20 max-w-lg">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-slate-400 mb-6">Your wallet address (<span className="font-mono text-xs">{account.substring(0,8)}...</span>) is not authorized to issue certificates. Please ask the Super Admin to add you.</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/admin/dashboard" className="btn-primary px-6 py-3 rounded-xl text-sm">Return to Dashboard</Link>
            <button 
              onClick={() => { disconnectWallet(); router.push('/admin/login'); }}
              className="px-6 py-3 rounded-xl text-sm font-medium text-slate-300 border border-white/10 hover:bg-white/5 hover:text-white transition-all"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Issue New Certificate</h1>
          <p className="text-slate-500 text-sm mt-1">Anchor a digital certificate permanently to the Ethereum blockchain</p>
        </div>
        <Link href="/admin/dashboard" className="text-sm text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 px-4 py-2 rounded-lg transition-all">
          ← Dashboard
        </Link>
      </div>

      {issuedCert ? (
        /* Success State */
        <div className="glass rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card), 0 0 60px rgba(16, 185, 129, 0.08)' }}>
          <div className="bg-gradient-to-r from-emerald-500/10 to-green-600/10 border-b border-green-500/20 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center animate-pulse-green">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-green-400">Certificate Issued on Ethereum!</h2>
                <p className="text-green-600 text-xs">Transaction confirmed and anchored to Sepolia testnet</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Certificate ID</p>
                <p className="font-mono text-sm text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg">{issuedCert.certificateId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Student</p>
                <p className="text-slate-900 dark:text-white font-semibold text-lg">{issuedCert.studentName}</p>
                <p className="text-slate-500 text-sm">{issuedCert.studentId} &bull; {issuedCert.studentEmail}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Course / Program</p>
                <div className="flex flex-col gap-2 items-start">
                  <span className="text-sm bg-violet-500/10 border border-violet-500/20 text-violet-400 px-3 py-1 rounded-full">{issuedCert.course}</span>
                  {issuedCert.certificateTitle && (
                    <span className="text-sm font-semibold dark:text-white text-slate-900">{issuedCert.certificateTitle}</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Transaction</p>
                <a href={`https://sepolia.etherscan.io/tx/${issuedCert.transactionHash}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-blue-400 hover:text-blue-300 break-all hover:underline transition-colors">
                  {issuedCert.transactionHash} ↗
                </a>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-4 border-l border-white/5 pl-8">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Scan to Verify</p>
              <div className="p-4 bg-white rounded-xl">
                <QRCode value={issuedCert.verifyUrl} size={140} />
              </div>
              <Link href={`/verify?id=${issuedCert.certificateId}`} className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors">
                View Verification Page ↗
              </Link>
            </div>
          </div>
          
          <div className="px-8 pb-8">
            <button onClick={() => { setIssuedCert(null); setStatusMsg(""); setFormData({ studentName: "", studentEmail: "", studentId: "", course: "", certificateTitle: "" }); setFile(null); }} className="text-sm text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white px-5 py-2.5 rounded-xl transition-all">
              Issue Another Certificate
            </button>
          </div>
        </div>
      ) : (
        /* Form State */
        <div className="glass rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-card)' }}>
          <form onSubmit={handleIssue} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Student Name</label>
                <input required type="text" className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} placeholder="e.g. Abishek Kumar" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Student ID</label>
                <input required type="text" className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} placeholder="e.g. RA2411003050262" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">College Email</label>
                <input required type="email" className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  value={formData.studentEmail} onChange={e => setFormData({...formData, studentEmail: e.target.value})} placeholder="student@college.edu" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Course / Program</label>
                <input required type="text" className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} placeholder="e.g. B.Tech Computer Science" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Certificate Title (Optional)</label>
                <input type="text" className="input-dark w-full px-4 py-3 rounded-xl text-sm"
                  value={formData.certificateTitle} onChange={e => setFormData({...formData, certificateTitle: e.target.value})} placeholder="e.g. Certificate of Excellence, Winner of Hackathon" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Certificate Document (PDF)</label>
              <label className="flex items-center space-x-3 input-dark px-4 py-3 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors">
                <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-slate-400 flex-1">{file ? file.name : "Choose PDF or Image file..."}</span>
                <input type="file" required accept="application/pdf,image/*" className="hidden" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
              </label>
              <p className="text-xs text-slate-600 mt-2">The document will be SHA-256 hashed to ensure cryptographic authenticity.</p>
            </div>
            
            {statusMsg && (
              <div className={`px-4 py-3.5 rounded-xl text-sm flex items-start space-x-3 ${isError ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                {!isError && loading && <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin flex-shrink-0 mt-0.5" />}
                <span>{statusMsg}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className={`btn-primary w-full py-4 px-6 rounded-xl text-sm flex items-center justify-center space-x-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Issue & Anchor to Blockchain</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
