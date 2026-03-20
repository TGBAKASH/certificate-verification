import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD5eUI1ODTRUnmwJWvFN_UPu_6KlmqPV3E",
  authDomain: "cert-verify-b858c.firebaseapp.com",
  projectId: "cert-verify-b858c",
  storageBucket: "cert-verify-b858c.firebasestorage.app",
  messagingSenderId: "359655785872",
  appId: "1:359655785872:web:19ddbaff6e695f96761f15",
  measurementId: "G-M6ZC608Z3K"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
