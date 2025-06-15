import React, { useState, useEffect } from "react";
import { Web3Provider } from "@ethersproject/providers";
import { parseEther } from "ethers";
import { QRCodeCanvas } from "qrcode.react";
import Web3Modal from "web3modal";

const CONTRACT_ADDRESS = "0xC89334a5aa130C6E9162cF45Db33168d078eFE80";

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [bnbAmount, setBnbAmount] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bnbPrice, setBnbPrice] = useState(null);
  const [correctNetwork, setCorrectNetwork] = useState(true);
  const [txHash, setTxHash] = useState(null);
  const [progressPercent, setProgressPercent] = useState(20);
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  const START_TIME = new Date("2025-06-10T00:00:00Z").getTime();
  const cycleDuration = 70 * 60 * 60;

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd")
      .then((res) => res.json())
      .then((data) => setBnbPrice(data.binancecoin.usd))
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
    if (!window.ethereum) return;
    try {
      const provider = new Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      setCorrectNetwork(network.chainId === 56);
    } catch (err) {
      console.warn("Network check failed:", err);
    }
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
      const provider = new Web3Provider(instance);
      const signer = provider.getSigner();
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
      const provider = new Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const tx = await signer.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: parseEther(bnbAmount),
      });

      setStatus("⏳ Transaction pending...");
      setTxHash(tx.hash);
      await tx.wait();
      setStatus("✅ Purchase successful! Tokens received instantly.");
    } catch (err) {
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
  const estimatedTokens =
    bnbAmount && bnbPrice ? Math.floor((bnbAmount * bnbPrice) / tokenPriceUSD).toLocaleString() : "0";

  return (
    <div>
      {/* Main UI and controls here */}

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
