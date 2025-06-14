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
