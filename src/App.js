import React, { useState, useEffect } from "react";
import { BrowserProvider, parseEther } from "ethers";
import { QRCodeCanvas } from "qrcode.react";
import Web3Modal from "web3modal";

const CONTRACT_ADDRESS = "0xC89334a5aa130C6E9162cF45Db33168d078eFE80";

const App = () => {
  const [walletAddress, setWalletAddress] = React.useState(null);
  const [bnbAmount, setBnbAmount] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [bnbPrice, setBnbPrice] = React.useState(null);
  const [correctNetwork, setCorrectNetwork] = React.useState(true);
  const [txHash, setTxHash] = React.useState(null);
  const [progressPercent, setProgressPercent] = React.useState(20);
  const [showWalletOptions, setShowWalletOptions] = React.useState(false);

  const START_TIME = new Date("2025-06-10T00:00:00Z").getTime();
  const cycleDuration = 70 * 60 * 60;

  React.useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd")
      .then(res => res.json())
      .then(data => setBnbPrice(data.binancecoin.usd))
      .catch(() => setBnbPrice(null));

    checkNetwork();

    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => window.location.reload());
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSeconds = (now - START_TIME) / 1000;
      const timeInCycle = elapsedSeconds % cycleDuration;
      const updatedProgress = 20 + (timeInCycle / cycleDuration) * (90 - 20);
      setProgressPercent(updatedProgress);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkNetwork = async () => {
    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    setCorrectNetwork(network.chainId === BigInt(56));
  };

  const connectWallet = async () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && !window.ethereum) {
      setShowWalletOptions(true);
      return;
    }

    try {
      const web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions: {},
      });
      const instance = await web3Modal.connect();
      const provider = new BrowserProvider(instance);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      checkNetwork();
    } catch (err) {
      console.error("Connection failed", err);
      setStatus("❌ Wallet connection failed.");
    }
  };

  const handleBuy = async () => {
    if (!walletAddress || !bnbAmount) {
      setStatus("⚠️ Enter BNB amount first.");
      return;
    }
    if (!correctNetwork) {
      setStatus("❗ Switch to Binance Smart Chain (BSC).");
      return;
    }

    try {
      setIsLoading(true);
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: parseEther(bnbAmount),
      });

      setStatus("⏳ Transaction pending...");
      setTxHash(tx.hash);
      await tx.wait();
      setStatus("✅ Purchase successful! Tokens received instantly.");
    } catch {
      setStatus("❌ Transaction failed.");
      setTxHash(null);
    } finally {
      setIsLoading(false);
    }
  };

  const addTokenToWallet = async () => {
    try {
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: CONTRACT_ADDRESS,
            symbol: "NIX",
            decimals: 18,
            image: "https://nixeltoken.github.io/nix-presale/logo.png",
          },
        },
      });
      if (wasAdded) {
        setStatus("✅ Token added to wallet!");
      } else {
        setStatus("❌ Token not added.");
      }
    } catch (error) {
      console.log(error);
      setStatus("❌ Failed to add token.");
    }
  };

  const equivalentUSD = bnbAmount && bnbPrice ? (bnbAmount * bnbPrice).toFixed(2) : "0.00";
  const tokenPriceUSD = 0.000095;
  const estimatedTokens = bnbAmount && bnbPrice
    ? Math.floor((bnbAmount * bnbPrice) / tokenPriceUSD).toLocaleString()
    : "0";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-indigo-950 to-gray-900 text-white p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2">🚀 NIXEL Presale</h1>
        <p className="text-sm text-gray-300">Dynamic Progress · Updates every second</p>
        <a href="https://x.com/NIXEL_BSC" target="_blank" rel="noreferrer" className="inline-block mt-2 text-cyan-300 underline text-sm">🐦 Follow on X</a>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
          <div className="bg-cyan-400 h-4 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progressPercent}%` }} />
        </div>

        <p className="text-center text-sm text-gray-300 mb-4">
          Sale Progress: {progressPercent.toFixed(2)}%
        </p>

        {walletAddress ? (
          <p className="text-center text-sm text-green-400 mb-2">👜 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
        ) : (
          <>
            <button onClick={connectWallet} className="w-full py-2 mb-2 bg-blue-600 rounded-md">🔗 Connect Wallet</button>
            <a href="https://metamask.app.link/dapp/nixeltoken.github.io/nix-presale/" target="_blank" rel="noreferrer" className="block text-center text-cyan-300 text-sm underline mb-3">📱 Open in MetaMask App</a>
          </>
        )}

        <input
          type="number"
          value={bnbAmount}
          onChange={(e) => setBnbAmount(e.target.value)}
          placeholder="Enter BNB amount"
          className="w-full p-3 mb-3 rounded-md bg-gray-800 text-white"
        />
        <p className="text-sm text-gray-300 mb-2">💲 ${equivalentUSD} ≈ {estimatedTokens} tokens</p>

        <button onClick={handleBuy} disabled={isLoading} className="w-full bg-green-600 py-2 rounded-md">
          {isLoading ? "Processing..." : "🛒 Buy Now"}
        </button>

        <button onClick={addTokenToWallet} className="mt-4 w-full py-2 bg-yellow-400 text-black font-semibold rounded-md hover:bg-yellow-300 transition">
          ➕ Add NIXEL Token to Wallet
        </button>

        {status && <p className="mt-3 text-center text-sm text-yellow-300">{status}</p>}
        {txHash && (
          <a
            className="block text-center mt-2 text-sm text-cyan-300 underline"
            href={`https://bscscan.com/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            🔍 View Transaction
          </a>
        )}

        <p className="mt-3 text-xs text-center text-gray-500">Tokens will be sent instantly to your wallet upon purchase.</p>
      </div>

      <div className="mt-10 text-center">
        <p className="mb-2 text-sm text-gray-300">📱 Scan this QR to open on MetaMask Mobile</p>
        <div className="inline-block p-2 bg-white rounded">
          <QRCodeCanvas value="https://nixeltoken.github.io/nix-presale/" size={160} />
        </div>
      </div>

      <footer className="mt-10 text-sm text-gray-500">© 2025 NIXEL. All rights reserved.</footer>

      {showWalletOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-white text-black rounded-xl p-6 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4">📱 Open in Wallet</h2>
            <p className="text-sm text-gray-700 mb-4">Choose your wallet to open this site inside it:</p>

            <a
              href="https://metamask.app.link/dapp/nixeltoken.github.io/nix-presale/"
              target="_blank"
              rel="noreferrer"
              className="block w-full py-2 mb-2 bg-orange-500 text-white rounded-md"
            >
              🦊 MetaMask
            </a>

            <a
              href="https://link.trustwallet.com/open_url?coin_id=20000714&url=https://nixeltoken.github.io/nix-presale/"
              target="_blank"
              rel="noreferrer"
              className="block w-full py-2 mb-2 bg-blue-600 text-white rounded-md"
            >
              🔐 Trust Wallet
            </a>

            <a
              href="rabby://app?url=https://nixeltoken.github.io/nix-presale/"
              target="_blank"
              rel="noreferrer"
              className="block w-full py-2 mb-4 bg-purple-600 text-white rounded-md"
            >
              🐰 Rabby Wallet
            </a>

            <button
              onClick={() => setShowWalletOptions(false)}
              className="text-sm text-gray-500 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
