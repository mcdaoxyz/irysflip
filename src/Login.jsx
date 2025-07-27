import React, { useState } from "react";
import { ethers } from "ethers";

export default function ConnectWallet({ setProvider, setSigner, setUserAddress }) {
  const [error, setError] = useState(null);

  const connect = async () => {
    if (!window.ethereum) {
      setError("MetaMask tidak ditemukan!");
      return;
    }
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setProvider(provider);
      setSigner(signer);
      setUserAddress(address);
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <button onClick={connect}>Connect Wallet</button>
      {error && <div style={{color:"red"}}>{error}</div>}
    </div>
  );
}
export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (!window.ethereum) throw new Error("Wallet not found");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setLoading(false);
      onLogin({ provider, signer, address });
    } catch (e) {
      setLoading(false);
      alert(e.message);
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
