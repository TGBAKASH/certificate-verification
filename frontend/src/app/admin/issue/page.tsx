"use client";
import { useState } from "react";
import { useWeb3 } from "@/context/Web3Context";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import axios from "axios";
import QRCode from "react-qr-code";
import Link from "next/link";
import certArtifact from "@/contracts/CertificateRegistry.json";

export default function IssueCertificate() {
  const { account, signer } = useWeb3();
  const router = useRouter();

  const [formData, setFormData] = useState({
    studentName: "",
    studentId: "",
    course: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [issuedCert, setIssuedCert] = useState<any>(null);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !signer) {
      alert("Please connect MetaMask account");
      return;
    }
    if (!file) {
      alert("Please upload a certificate PDF");
      return;
    }

    setLoading(true);
    setStatusMsg("Uploading document and generating hash...");

    try {
      // 1. Upload to backend to get the hash and path
      const uploadData = new FormData();
      uploadData.append("document", file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

      const uploadRes = await axios.post(`${API_URL}/upload`, uploadData);
      const docHash = uploadRes.data.hash;
      const filePath = uploadRes.data.filePath;

      // 2. Setup Smart Contract tx
      setStatusMsg("Waiting for blockchain confirmation... Please approve the MetaMask transaction.");
      const contractAddress = certArtifact.address;
      const contract = new ethers.Contract(contractAddress, certArtifact.abi, signer);

      const certId = `CERT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const tx = await contract.issueCertificate(certId, docHash);
      setStatusMsg("Transaction submitted. Waiting for mining...");
      const receipt = await tx.wait();

      // 3. Save to backend database
      setStatusMsg("Saving records to database...");
      const metadata = {
        certificateId: certId,
        studentName: formData.studentName,
        studentId: formData.studentId,
        course: formData.course,
        filePath: filePath,
        blockchainHash: docHash,
        issuerWallet: account,
        transactionHash: receipt.hash
      };

      await axios.post(`${API_URL}/issue-certificate`, metadata);

      setIssuedCert({ ...metadata, verifyUrl: `${window.location.origin}/verify?id=${certId}` });
      setStatusMsg("Certificate issued successfully!");
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!account) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold">Unauthorized</h2>
        <p className="mt-2 text-slate-500">Please login to access this page.</p>
        <Link href="/admin/login" className="text-blue-600 hover:underline mt-4 inline-block">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
         <h1 className="text-3xl font-bold text-slate-900">Issue New Certificate</h1>
         <Link href="/admin/dashboard" className="text-slate-500 hover:text-slate-900 underline text-sm">
           &larr; Back to Dashboard
         </Link>
      </div>

      {issuedCert ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-green-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600">Certificate successfully issued on Ethereum!</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div>
                 <p className="text-sm text-slate-500">Certificate ID</p>
                 <p className="font-mono bg-slate-100 p-2 rounded text-slate-700">{issuedCert.certificateId}</p>
               </div>
               <div>
                 <p className="text-sm text-slate-500">Student</p>
                 <p className="font-semibold text-lg">{issuedCert.studentName} ({issuedCert.studentId})</p>
               </div>
               <div>
                 <p className="text-sm text-slate-500">Course</p>
                 <p className="font-medium text-slate-800">{issuedCert.course}</p>
               </div>
               <div>
                 <p className="text-sm text-slate-500">Transaction Hash</p>
                 <a href={`https://sepolia.etherscan.io/tx/${issuedCert.transactionHash}`} target="_blank" rel="noreferrer" className="font-mono text-sm text-blue-600 hover:underline break-all">
                   {issuedCert.transactionHash}
                 </a>
               </div>
            </div>
            <div className="flex flex-col items-center justify-center space-y-4 border-l border-slate-100 pl-8">
               <p className="text-sm font-medium text-slate-500 uppercase tracking-widest text-center">Scan to Verify</p>
               <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                 <QRCode value={issuedCert.verifyUrl} size={150} />
               </div>
               <Link href={`/verify?id=${issuedCert.certificateId}`} className="text-sm text-blue-600 font-medium hover:underline">
                 View Verification Page
               </Link>
            </div>
          </div>
          <button onClick={() => setIssuedCert(null)} className="mt-8 bg-slate-100 text-slate-700 hover:bg-slate-200 px-6 py-2 rounded-lg font-medium transition-colors">
            Issue Another
          </button>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <form onSubmit={handleIssue} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={formData.studentName} onChange={e => setFormData({...formData, studentName: e.target.value})} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student ID</label>
                <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} placeholder="STU-12345" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Course / Program</label>
              <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" value={formData.course} onChange={e => setFormData({...formData, course: e.target.value})} placeholder="B.S. in Computer Science" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Certificate Document (PDF)</label>
              <input required type="file" accept="application/pdf,image/*" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-600" onChange={e => setFile(e.target.files ? e.target.files[0] : null)} />
              <p className="text-xs text-slate-500 mt-2">The document will be hashed to ensure cryptographic authenticity.</p>
            </div>
            
            {statusMsg && (
              <div className={`p-4 rounded-lg text-sm ${statusMsg.startsWith('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                {statusMsg}
              </div>
            )}

            <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {loading ? "Processing..." : "Issue & Anchor to Blockchain"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
