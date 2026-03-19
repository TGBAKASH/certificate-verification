"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [certId, setCertId] = useState("");
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      router.push(`/verify?id=${certId.trim()}`);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center">
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mb-12">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-4 py-2 rounded-full">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span>Powered by Ethereum Blockchain</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
          Verify Certificates
          <br />
          <span className="gradient-text">with Blockchain</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
          Instantly verify the authenticity of digital certificates using Ethereum smart contracts. Fraud-proof, transparent, and permanent.
        </p>
      </div>

      {/* Search Card */}
      <div className="glass rounded-2xl p-8 w-full max-w-xl shadow-2xl" style={{ boxShadow: 'var(--shadow-card), var(--shadow-glow)' }}>
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-1">Certificate Lookup</h2>
          <p className="text-slate-500 text-sm">Enter the certificate ID to check its blockchain authenticity</p>
        </div>
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <input
              type="text"
              id="certId"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="e.g. CERT-1741234567890-1234"
              className="input-dark w-full px-4 py-3.5 rounded-xl text-sm font-mono"
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full py-3.5 px-6 rounded-xl text-sm">
            Verify Certificate →
          </button>
        </form>
      </div>

      {/* Feature Pills */}
      <div className="flex flex-wrap justify-center gap-3 mt-12">
        {[
          { icon: '🔒', label: 'Cryptographically Secured' },
          { icon: '⛓️', label: 'On-Chain Verification' },
          { icon: '⚡', label: 'Instant Results' },
          { icon: '🌐', label: 'QR Code Sharing' },
        ].map((f) => (
          <div key={f.label} className="flex items-center space-x-2 glass px-4 py-2 rounded-full text-sm text-slate-400">
            <span>{f.icon}</span>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

