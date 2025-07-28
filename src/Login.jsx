import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "@walletconnect/qrcode-modal";

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
  },
  {
    name: "WalletConnect",
    key: "isWalletConnect",
    logo: "https://docs.walletconnect.com/img/walletconnect-logo.svg"
  }
];

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [error, setError] = useState("");
  const [connector, setConnector] = useState(null);

  useEffect(() => {
    // Deteksi multi-wallet
    if (window.ethereum?.providers?.length) {
      setWallets(window.ethereum.providers);
    } else if (window.ethereum) {
      setWallets([window.ethereum]);
    } else {
      // Jika tidak ada wallet terdeteksi, tetap tampilkan WalletConnect
      setWallets([{ isWalletConnect: true }]);
    }
    
    // Bersihkan session saat komponen unmount
    return () => {
      if (connector) {
        connector.killSession();
      }
    };
  }, []);

  // Dapatkan nama & logo wallet
  const getWalletName = (provider) => {
    for (const w of WALLET_LIST) {
      if (provider[w.key] || (w.key === "isWalletConnect" && provider.isWalletConnect)) {
        return w.name;
      }
    }
    return "Unknown Wallet";
  };
  
  const getWalletLogo = (provider) => {
    for (const w of WALLET_LIST) {
      if (provider[w.key] || (w.key === "isWalletConnect" && provider.isWalletConnect)) {
        return w.logo;
      }
    }
    return "";
  };

  // Fungsi connect wallet dengan WalletConnect
  const connectWithWalletConnect = async () => {
    try {
      // Buat konektor baru
      const newConnector = new WalletConnect({
        bridge: "https://bridge.walletconnect.org",
        qrcodeModal: QRCodeModal,
      });

      setConnector(newConnector);

      // Cek jika koneksi sudah ada
      if (!newConnector.connected) {
        await newConnector.createSession();
      }

      // Subscribe to events
      newConnector.on("connect", async (error, payload) => {
        if (error) throw error;
        
        const { accounts } = payload.params[0];
        const address = accounts[0];
        
        // Buat custom provider untuk WalletConnect
        const provider = new ethers.providers.Web3Provider(newConnector);
        const signer = provider.getSigner();
        
        setLoading(false);
        onLogin({ provider, signer, address });
      });

      newConnector.on("session_update", (error, payload) => {
        if (error) throw error;
      });

      newConnector.on("disconnect", (error) => {
        if (error) throw error;
        setError("Wallet disconnected");
        setLoading(false);
      });
    } catch (e) {
      setLoading(false);
      handleError(e);
    }
  };

  // Fungsi connect wallet biasa
  const connectStandardWallet = async (provider) => {
    try {
      if (!provider) throw new Error("Wallet not found");
      
      // Jika multi-wallet, override window.ethereum
      if (provider !== window.ethereum) {
        window.ethereum = provider;
      }
      
      const ethProvider = new ethers.providers.Web3Provider(provider);
      await ethProvider.send("eth_requestAccounts", []);
      const signer = ethProvider.getSigner();
      const address = await signer.getAddress();
      
      onLogin({ provider: ethProvider, signer, address });
    } catch (e) {
      handleError(e);
    }
  };

  // Fungsi handle error
  const handleError = (e) => {
    const msg = 
      e?.message ||
      e?.data?.message ||
      e?.error?.message ||
      e?.reason ||
      (typeof e === "string" ? e : "Unexpected error");
    
    setError(msg);
    console.error("Wallet Connect Error:", e);
    
    // Reset WalletConnect jika error
    if (connector) {
      connector.killSession();
      setConnector(null);
    }
  };

  // Fungsi connect wallet utama
  const handleLogin = async (provider) => {
    setLoading(true);
    setError("");
    
    try {
      if (provider.isWalletConnect) {
        await connectWithWalletConnect();
      } else {
        await connectStandardWallet(provider);
      }
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
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
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(16,16,32,0.55)",
          backdropFilter: "blur(0.5px)",
          zIndex: 0,
        }}
      ></div>
      {/* Card */}
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
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 19,
          marginBottom: 14,
          color: "#fff",
          textShadow: "0 0 14px #111"
        }}>
          Flip your luck, win on datachain!
        </div>

        {/* Pilihan Wallet */}
        <div style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 18,
          color: "#fff",
          marginBottom: 10,
          marginTop: 10
        }}>
          Select Wallet
        </div>
        <div style={{ 
          display: "flex", 
          gap: 20, 
          justifyContent: "center", 
          marginBottom: 20,
          flexWrap: "wrap"
        }}>
          {wallets.map((provider, idx) => (
            <button
              key={idx}
              onClick={() => handleLogin(provider)}
              disabled={loading}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#151b22",
                border: "2.5px solid #16ffb8",
                borderRadius: 14,
                padding: "18px 20px",
                minWidth: 120,
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.66 : 1,
                transition: "transform 0.2s, border-color 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
              <img
                src={getWalletLogo(provider)}
                alt="wallet"
                style={{ 
                  width: 44, 
                  height: 44, 
                  marginBottom: 10, 
                  borderRadius: 8, 
                  background: "#fff",
                  objectFit: "contain",
                  padding: provider.isWalletConnect ? 4 : 0
                }}
              />
              <span style={{ 
                color: "#fff", 
                fontFamily: "monospace", 
                fontSize: 14, 
                marginBottom: 3 
              }}>
                {getWalletName(provider)}
              </span>
              <span style={{ 
                color: "#16ffb8", 
                fontSize: 11,
                height: 14
              }}>
                {loading ? "CONNECTING..." : "Connect"}
              </span>
            </button>
          ))}
        </div>

        {/* Loading indicator */}
        {loading && !error && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            margin: "10px 0"
          }}>
            <div style={{
              width: 30,
              height: 30,
              border: "3px solid rgba(22, 255, 184, 0.3)",
              borderTop: "3px solid #16ffb8",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
          </div>
        )}

        {/* Error message */}
        {error && <div style={{
          margin: "12px 0 0",
          color: "#ff7b7b",
          fontFamily: "'VT323', monospace",
          fontSize: "1.1rem",
          letterSpacing: "0.03em",
          minHeight: 24
        }}>{error}</div>}

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
              color: "#fff",
              textDecoration: "underline",
              fontWeight: 700
            }}
          >
            @mcdaoxyz
          </a>
        </div>
      </div>
      
      {/* Animasi spin */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
