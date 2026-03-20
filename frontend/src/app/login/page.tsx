"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      
      // Ensure they exist in DB, if not create them
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      try {
        await axios.post(`${API_URL}/auth/register`, {
          idToken,
          name: userCredential.user.displayName || "Google User",
          email: userCredential.user.email,
          enrollmentId: `OAUTH-${userCredential.user.email?.split('@')[0] || Date.now()}`
        });
      } catch (postErr: any) {
        // Ignore duplicate key error (11000) which means they already exist
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to log in with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20">
      <div className="glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold gradient-text text-center mb-6">Student Login</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
            className="w-full btn-primary py-3 rounded-xl mt-2 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Access Dashboard"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between">
          <hr className="w-full border-slate-700/50" />
          <span className="px-3 text-slate-500 text-xs uppercase">or</span>
          <hr className="w-full border-slate-700/50" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white/10 text-white border border-white/20 py-3 rounded-xl mt-4 hover:bg-white/20 transition-all disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-500 hover:text-blue-400">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
