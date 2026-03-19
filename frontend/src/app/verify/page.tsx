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
      // Auto trigger verification against DB hash & Blockchain
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
      if (file) {
        formData.append("document", file);
      }

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
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
          <p className="text-slate-500 font-medium">Fetching certificate data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 shadow-sm">
          <div className="text-red-500 mb-4 inline-block">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">Certificate Not Found</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <Link href="/" className="bg-white text-red-700 border border-red-200 hover:bg-red-50 px-6 py-2 rounded-lg font-medium transition-colors">
            Try Another ID
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-6">
        <Link href="/" className="text-slate-500 hover:text-slate-900 underline text-sm inline-flex items-center space-x-1">
          <span>&larr;</span> <span>Back to Search</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Verification Result Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`p-6 rounded-2xl border shadow-sm text-center transition-colors ${
              verifyStatus === 'VERIFYING' ? 'bg-amber-50 border-amber-200' :
              verifyStatus === 'VALID' ? 'bg-green-50 border-green-200' :
              verifyStatus === 'INVALID' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
            }`}>
            
            {verifyStatus === 'VERIFYING' && (
              <div className="py-8">
                <div className="h-10 w-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
                <h3 className="text-lg font-bold text-amber-700">Verifying on Blockchain...</h3>
                <p className="text-sm text-amber-600 mt-2">Checking cryptographic signatures</p>
              </div>
            )}

            {verifyStatus === 'VALID' && (
              <div className="py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-green-700 uppercase tracking-wide">Valid Certificate</h2>
                <p className="text-green-600 mt-2 text-sm font-medium">Verified by Ethereum Smart Contract</p>
                <div className="mt-6 pt-6 border-t border-green-200/50 text-left">
                  <p className="text-xs text-green-700 font-semibold uppercase mb-1">Blockchain Timestamp</p>
                  <p className="text-sm font-mono text-green-800 bg-green-100/50 py-1 px-2 rounded">
                    {new Date(Number(verifyData?.onchainTimestamp) * 1000).toLocaleString() || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {verifyStatus === 'INVALID' && (
              <div className="py-6">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-extrabold text-red-700 uppercase tracking-wide mb-2">Invalid Certificate</h2>
                <p className="text-sm text-red-600 bg-red-100/50 p-3 rounded text-left">{verifyMessage}</p>
              </div>
            )}
            
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
             <p className="text-sm font-semibold text-slate-800 mb-4">Share Verification Link</p>
             <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 inline-block mb-4">
                <QRCode value={typeof window !== "undefined" ? window.location.href : ""} size={120} />
             </div>
             <div className="flex gap-2">
               <input type="text" readOnly value={typeof window !== "undefined" ? window.location.href : ""} className="flex-1 text-xs text-center text-slate-500 bg-slate-100 py-2 rounded-l border border-slate-200 focus:outline-none" />
               <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="text-xs bg-slate-900 text-white px-3 py-2 rounded-r hover:bg-slate-700 transition-colors whitespace-nowrap">Copy</button>
             </div>
          </div>

        </div>

        {/* Right Column: Certificate Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-10 border-b border-l border-slate-100"></div>
            <h3 className="text-2xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4">Certificate Metadata</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-500">Student Name</p>
                <p className="text-lg font-semibold text-slate-900">{certData.studentName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Student ID</p>
                <p className="text-lg font-semibold text-slate-700">{certData.studentId}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-medium text-slate-500">Course / Program</p>
                <p className="text-lg font-medium text-blue-700 bg-blue-50 py-2 px-3 rounded inline-block mt-1">{certData.course}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Issued On</p>
                <p className="text-slate-700">{new Date(certData.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Issuer Wallet Address</p>
                <p className="font-mono text-xs text-slate-500 break-all bg-slate-100 p-2 rounded mt-1">{certData.issuerWallet}</p>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
               <p className="text-sm font-medium text-slate-500 mb-2">Cryptographic Fingerprint (SHA256)</p>
               <p className="font-mono text-xs text-slate-600 break-all bg-slate-50 border border-slate-200 p-3 rounded">{certData.blockchainHash}</p>
            </div>
            <div className="mt-4">
               <p className="text-sm font-medium text-slate-500 mb-1">Blockchain Transaction</p>
               <a href={`https://sepolia.etherscan.io/tx/${certData.transactionHash}`} target="_blank" rel="noreferrer" className="text-sm font-mono text-blue-600 hover:underline">
                 {certData.transactionHash} &nearr;
               </a>
            </div>
          </div>

          {/* Manual File Verification Block - Always visible */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 className="font-semibold text-slate-900 flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Verify Original Document
              </h4>
              <p className="text-sm text-slate-600 mb-4">Want to be absolutely sure? Upload the digital certificate PDF to cryptographically compare its fingerprint against the blockchain record.</p>
              
              <form onSubmit={handleManualVerification} className="flex flex-col sm:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                  <input type="file" required accept="application/pdf,image/*" onChange={(e) => setFileToVerify(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-700 hover:file:bg-slate-100 border border-slate-300 rounded-lg outline-none bg-white p-1" />
                </div>
                <button type="submit" disabled={verifyStatus === 'VERIFYING'} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-lg font-medium text-sm transition-colors whitespace-nowrap">
                  Check Document
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
    <Suspense fallback={<div className="flex justify-center items-center h-[60vh]"><p className="text-slate-500 font-medium">Loading...</p></div>}>
      <VerifyCertificateContent />
    </Suspense>
  );
}
