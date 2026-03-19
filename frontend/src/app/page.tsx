"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [certId, setCertId] = useState("");
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId) {
      router.push(`/verify/${certId}`);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">
          Verify Certificates with <span className="text-blue-600">Blockchain</span>
        </h1>
        <p className="text-lg text-slate-600">
          Ensure the authenticity of digital certificates instantly using Ethereum smart contracts. Fraud-proof. Transparent. Secure.
        </p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100">
        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label htmlFor="certId" className="block text-sm font-medium text-slate-700 mb-2">
              Certificate ID
            </label>
            <input
              type="text"
              id="certId"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="e.g. CERT-2024-89X2"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Verify Certificate
          </button>
        </form>
      </div>
    </div>
  );
}
