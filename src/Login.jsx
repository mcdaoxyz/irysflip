import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Login({ onLogin }) {
  const [wallet, setWallet] = useState(null);      // untuk satu provider
  const [wallets, setWallets] = useState([]);      // deklarasi state wallets
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    let providersList = [];
    if (window.ethereum?.providers?.length) {
      providersList = window.ethereum.providers;
    } else if (window.ethereum) {
      providersList = [window.ethereum];
    }
    console.log("Detected providers:", providersList);
    setWallets(providersList);

    const p = providersList[0] || null;
    if (p) {
      window.ethereum = p;
      setWallet(p);
      console.log("Selected provider:", {
        isMetaMask: Boolean(p.isMetaMask),
        isOKExWallet: Boolean(p.isOKExWallet),
      });
    }
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      if (!wallet) throw new Error("Wallet not detected");
      const provider = new ethers.providers.Web3Provider(wallet);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setLoading(false);
      onLogin({ provider, signer, address });
    } catch (e) {
      setLoading(false);
      const msg =
        e?.message ||
        e?.data?.message ||
        e?.error?.message ||
        e?.reason ||
        (typeof e === "string" ? e : "Unexpected error");
      setError(msg);
      console.error("Connect Error:", e);
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
        {wallets.length > 1 ? (
          <>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 18,
              color: "#fff",
              marginBottom: 10,
              marginTop: 10
            }}>
              Select Wallet
            </div>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 20 }}>
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
                    padding: "18px 28px",
                    minWidth: 120,
                    cursor: loading ? "wait" : "pointer",
                    opacity: loading ? 0.66 : 1
                  }}
                >
                  <img
                    src={getWalletLogo(provider)}
                    alt="wallet"
                    style={{ width: 44, height: 44, marginBottom: 10, borderRadius: 8, background: "#fff" }}
                  />
                  <span style={{ color: "#fff", fontFamily: "monospace", fontSize: 18, marginBottom: 3 }}>
                    {getWalletName(provider)}
                  </span>
                  <span style={{ color: "#16ffb8", fontSize: 11 }}>
                    {loading ? "CONNECTING..." : "Connect"}
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            onClick={() => handleLogin(wallets[0])}
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
        )}

        {/* Error message */}
        {error && <div style={{
          margin: "12px 0 0",
          color: "#ff7b7b",
          fontFamily: "'VT323', monospace",
          fontSize: "1.1rem",
          letterSpacing: "0.03em"
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
         <div>
      {wallets.length === 0 ? (
        <p>No wallet detected</p>
      ) : (
        <button onClick={handleLogin} disabled={!wallet || loading}>
          {loading ? "Connecting..." : "Connect"}
        </button>
      )}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
      </div>
    </div>
  );
}
