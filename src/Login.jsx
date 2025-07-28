import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

const WALLET_LIST = [
  {
    name: "MetaMask",
    key: "isMetaMask",
    logo: "https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg"
  },
  {
    name: "OKX Wallet",
    key: "isOKExWallet",
    logo: "https://static.okx.com/cdn/assets/imgs/MjAxOTY0NzY2ODMwMg==.png"
  },
  {
    name: "Bitget Wallet",
    key: "isBitKeep",
    logo: "https://www.bitget.com/static/bgwallet/favicon.ico"
  }
];

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Deteksi wallet multi-provider (EIP-5749)
    if (window.ethereum?.providers?.length) {
      setWallets(window.ethereum.providers);
    } else if (window.ethereum) {
      setWallets([window.ethereum]);
    } else {
      setWallets([]);
    }
  }, []);

  // Dapatkan nama wallet dari objek provider
  const getWalletName = (provider) => {
    for (const w of WALLET_LIST) if (provider[w.key]) return w.name;
    return "Unknown Wallet";
  };
  // Dapatkan logo wallet
  const getWalletLogo = (provider) => {
    for (const w of WALLET_LIST) if (provider[w.key]) return w.logo;
    return "";
  };

  // Fungsi connect untuk wallet tertentu
  const handleLogin = async (provider) => {
    setLoading(true);
    setError("");
    try {
      if (!provider) throw new Error("Wallet not found");
      window.ethereum = provider; // force override jika multi-wallet
      const ethProvider = new ethers.providers.Web3Provider(provider);
      await ethProvider.send("eth_requestAccounts", []);
      const signer = ethProvider.getSigner();
      const address = await signer.getAddress();
      setLoading(false);
      onLogin({ provider: ethProvider, signer, address });
    } catch (e) {
      setLoading(false);
      setError(
        e?.message ||
        e?.data?.message ||
        e?.error?.message ||
        e?.reason ||
        JSON.stringify(e) ||
        "Unexpected error"
      );
      console.error("Wallet Connect Error:", e, typeof e, JSON.stringify(e));
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col justify-center items-center"
      style={{
        backgroundImage: "url('/pixel-landscape.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        minHeight: "100vh",
        width: "100vw",
        fontFamily: "'Press Start 2P', monospace",
        position: "relative",
      }}
    >
      {/* Optional overlay supaya teks/card tetap jelas */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(16,16,32,0.55)",
          backdropFilter: "blur(0.5px)",
          zIndex: 0,
        }}
      ></div>
      {/* Konten login */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "#111d",
          border: "3px solid #444",
          borderRadius: 14,
          padding: "34px 36px",
          minWidth: 340,
          maxWidth: "95vw",
          textAlign: "center",
          boxShadow: "0 4px 0 #222",
        }}
      >
       <h1 style={{
  color: "#fff",
  fontSize: "2rem",
  letterSpacing: "0.14em",
  marginBottom: 10,
  textShadow: "2px 2px 0 #111, 0 0 14px #39ff14"
}}>
  IRYSFLIP
</h1>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            background: "#14ff94",
            color: "#111",
            border: "3px solid #fff",
            borderRadius: 7,
            fontSize: "1.3rem",
            padding: "16px 52px",
            margin: "20px 0 18px",
            cursor: loading ? "wait" : "pointer",
            boxShadow: "0 2px 0 #111",
            opacity: loading ? 0.7 : 1,
            transition: "0.2s"
          }}
        >{loading ? "CONNECTING..." : "PLAY"}</button>
        <div
          style={{
            background: "#222c",
            color: "#fff",
            fontFamily: "'VT323', monospace",
            padding: "10px 0 0",
            fontSize: "1.06rem"
          }}
        >
        </div>
        <div style={{
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 19,
  marginBottom: 14,
  color: "#41ffe8",
  textShadow: "0 0 14px #23f9be"
}}>
  Flip your luck, win on datachain!
</div>
        <div style={{
  margin: "18px 0 0",
  fontSize: 16,
  color: "#fff"
}}>
  Made with 💚 by{" "}
  <a
    href="https://twitter.com/mcdaoxyz"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: "#41ffe8",
      textDecoration: "underline",
      fontWeight: 700
    }}
  >
    @mcdaoxyz
  </a>
</div>
      </div>
    </div>
  );
}
