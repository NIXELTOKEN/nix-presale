import React, { useState, useEffect } from "react";
import { BrowserProvider, parseEther } from "ethers";
import { QRCodeCanvas } from "qrcode.react";

const CONTRACT_ADDRESS = "0xC89334a5aa130C6E9162cF45Db33168d078eFE80";

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [bnbAmount, setBnbAmount] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [bnbPrice, setBnbPrice] = useState(null);
  const [tokensSold, setTokensSold] = useState(0);
  const [correctNetwork, setCorrectNetwork] = useState(true);
  const [txHash, setTxHash] = useState(null);

  const STAGES = [
    { cap: 2_000_000_000, price: 0.000095 },
    { cap: 1_500_000_000, price: 0.0005 },
    { cap: 500_000_000, price: 0.00085 },
  ];

  const totalSold = tokensSold;
  let stageIndex = 0;
  let cumulativeCap = 0;
  for (let i = 0; i < STAGES.length; i++) {
    cumulativeCap += STAGES[i].cap;
    if (totalSold < cumulativeCap) {
      stageIndex = i;
      break;
    }
  }

  const stageCap = STAGES[stageIndex].cap;
  const tokenPriceUSD = STAGES[stageIndex].price;
  const tokensInStage = totalSold - (cumulativeCap - stageCap);

  useEffect(() => {
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd")
      .then(res => res.json())
      .then(data => setBnbPrice(data.binancecoin.usd))
      .catch(() => setBnbPrice(null));

    checkNetwork();
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
  }, []);

  const checkNetwork = async () => {
    const provider = new BrowserProvider(window.ethereum);
    const network = await provider.getNetwork();
    console.log("Network chainId:", network.chainId); // للتأكد من القيمة
    setCorrectNetwork(network.chainId === 56); // رقم عادي وليس BigInt
  };

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        setWalletAddress(accounts[0]);
        checkNetwork();
      } catch {
        setStatus("❌ Wallet connection failed.");
      }
    } else {
      setStatus("Please install MetaMask or any Web3 wallet.");
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
      const tokensBought = Number(bnbAmount) * (bnbPrice / tokenPriceUSD);
      setTokensSold(prev => prev + tokensBought);
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
            image: "/logo.png",
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

  const progressPercent = (tokensInStage / stageCap) * 100;
  const equivalentUSD = bnbAmount && bnbPrice ? (bnbAmount * bnbPrice).toFixed(2) : "0.00";
  const estimatedTokens = bnbAmount && bnbPrice
    ? Math.floor((bnbAmount * bnbPrice) / tokenPriceUSD).toLocaleString()
    : "0";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-black via-indigo-950 to-gray-900 text-white p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2">🚀 NIXEL Presale</h1>
        <p className="text-sm text-gray-300">Stage {stageIndex + 1} · Price: {tokenPriceUSD}$ ≈ {(tokenPriceUSD / bnbPrice).toFixed(8)} BNB</p>
        <a href="https://x.com/NIXEL_BSC" target="_blank" rel="noreferrer" className="inline-block mt-2 text-cyan-300 underline text-sm">🐦 Follow on X</a>
      </div>

      <div className="bg-white bg-opacity-10 backdrop-blur-md rounded-xl shadow-2xl p-6 max-w-md w-full">
        <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
          <div className="bg-cyan-400 h-4 rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>

        <p className="text-center text-sm text-gray-300 mb-4">
          {tokensInStage.toLocaleString()} / {stageCap.toLocaleString()} tokens sold
        </p>

        {walletAddress ? (
          <p className="text-center text-sm text-green-400 mb-2">👜 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</p>
        ) : (
          <button onClick={connectWallet} className="w-full py-2 mb-3 bg-blue-600 rounded-md">🔗 Connect Wallet</button>
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
    </div>
  );
};

export default App;
