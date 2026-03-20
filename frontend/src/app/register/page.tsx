"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function StudentRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enrollmentId, setEnrollmentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // 2. Sync with backend MongoDB
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      await axios.post(`${API_URL}/auth/register`, {
        idToken,
        name,
        email,
        enrollmentId
      });

      // 3. Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      // If backend fails but Firebase succeeds, we have a synchronization issue, but for simple MVP it will show error.
      setError(err.response?.data?.error || err.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold gradient-text text-center mb-6">Student Registration</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full input-dark px-4 py-3 rounded-xl focus:outline-none"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Enrollment / Student ID</label>
            <input
              type="text"
              required
              value={enrollmentId}
              onChange={(e) => setEnrollmentId(e.target.value)}
              className="w-full input-dark px-4 py-3 rounded-xl focus:outline-none"
              placeholder="STU-2026-X99"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">College Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-dark px-4 py-3 rounded-xl focus:outline-none"
              placeholder="student@college.edu"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full input-dark px-4 py-3 rounded-xl focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl mt-4 disabled:opacity-50"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-500 hover:text-blue-400">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
