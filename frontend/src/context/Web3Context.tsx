"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

interface Web3ContextType {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connectWallet: (forcePrompt?: boolean) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  isConnecting: boolean;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  provider: null,
  signer: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  isConnecting: false,
});

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" }).then((accounts: string[]) => {
        const wasDisconnected = localStorage.getItem("walletDisconnected") === "true";
        if (accounts.length > 0 && !wasDisconnected) {
          connectWallet();
        }
      });

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          connectWallet();
        } else {
          disconnectWallet();
        }
      });
    }
  }, []);

  const connectWallet = async (forcePrompt: boolean = false) => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }
    setIsConnecting(true);
    try {
      // Prompt user to switch to Sepolia testnet (Chain ID: 11155111 or 0xaa36a7)
      const SEPOLIA_CHAIN_ID = "0xaa36a7";
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch (switchError: any) {
        console.warn("Wallet switch failed or Sepolia not added:", switchError);
      }

      if (forcePrompt) {
        try {
          await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch (permError: any) {
          if (permError.code === 4001) {
            // User rejected the request
            setIsConnecting(false);
            return;
          }
          console.error("Permissions request failed", permError);
        }
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const jsonSigner = await browserProvider.getSigner();

      setProvider(browserProvider);
      setSigner(jsonSigner);
      setAccount(accounts[0]);
      localStorage.removeItem("walletDisconnected");
    } catch (error) {
      console.error("Failed to connect wallet", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    localStorage.setItem("walletDisconnected", "true");
    setAccount(null);
    setProvider(null);
    setSigner(null);

    // Force MetaMask to show the account picker so user can switch wallets
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        await window.ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        });
        // After user picks a new account, connect it
        localStorage.removeItem("walletDisconnected");
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.send("eth_requestAccounts", []);
        const jsonSigner = await browserProvider.getSigner();
        setProvider(browserProvider);
        setSigner(jsonSigner);
        setAccount(accounts[0]);
      } catch (err: any) {
        // User cancelled — stay disconnected & go to login
        console.log("Wallet switch cancelled or failed:", err?.message);
      }
    }
  };


  return (
    <Web3Context.Provider value={{ account, provider, signer, connectWallet, disconnectWallet, isConnecting }}>
      {children}
    </Web3Context.Provider>
  );
};
