"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import axios from "axios";
import Link from "next/link";

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [certificates, setCertificates] = useState<any[]>([]);
  const [studentData, setStudentData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    } else if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    try {
      const idToken = await user?.getIdToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      
      const res = await axios.get(`${API_URL}/auth/dashboard`, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });

      setStudentData(res.data.student);
      setCertificates(res.data.certificates);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load dashboard data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (authLoading || loadingData) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <div className="glass inline-block p-10 rounded-2xl">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={handleLogout} className="btn-primary px-6 py-2 rounded-xl text-sm">
            Sign Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Dashboard Header */}
      <div className="glass rounded-2xl p-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Welcome, <span className="gradient-text">{studentData?.name}</span>
          </h1>
          <p className="text-sm text-slate-500">
            {studentData?.enrollmentId} &bull; {studentData?.email}
          </p>
        </div>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors">
          Sign Out
        </button>
      </div>

      {/* Certificates Grid */}
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Your Issued Certificates</h2>
      
      {certificates.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <div className="text-5xl mb-4 opacity-50">🎓</div>
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">No certificates yet</h3>
          <p className="text-sm text-slate-400 mt-2">Any certificates issued to your email will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert) => (
            <div key={cert.certificateId} className="glass rounded-2xl p-6 hover:-translate-y-1 transition-transform cursor-pointer relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-violet-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono bg-slate-100 dark:bg-white/5 text-slate-500 px-2 py-1 rounded">
                  #{cert.certificateId.substring(0, 8)}...
                </span>
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10 px-2 py-1 rounded">
                  Verified
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{cert.course}</h3>
              <p className="text-sm text-slate-500 mb-6">Issued {new Date(cert.issueDate).toLocaleDateString()}</p>
              
              <Link href={`/verify?id=${cert.certificateId}`} className="block w-full text-center text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 py-2 rounded-lg transition-colors">
                View Certificate Record
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
