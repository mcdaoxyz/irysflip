import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { COINFLIP_ABI } from "./utils/coinflipABI";
import { switchToIrys } from "./utils/network";
import ResultModal from "./components/ResultModal";

const CONTRACT_ADDRESS = "0x3ef1a34D98e7Eb2CEB089df23B306328f4a05Aa9";

export default function DashboardOnchain({ provider, signer, userAddress }) {
  const [choice, setChoice] = useState("heads");
  const [amount, setAmount] = useState(0.1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [animating, setAnimating] = useState(false);
  const [rewardConfirmed, setRewardConfirmed] = useState(false);
  const [lastBetBlock, setLastBetBlock] = useState(null);
  const [betHistory, setBetHistory] = useState([]);

  const [showModal, setShowModal] = useState(false);
const [modalPhase, setModalPhase] = useState("submitting"); // "submitting", "result"
const [betResult, setBetResult] = useState(null); // "win" | "lose" | null
const [txid, setTxid] = useState(null);
const isModalOpen = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalResult, setModalResult] = useState("");

  const fontPixel = { fontFamily: "'Press Start 2P', monospace" };
  const betOptions = [0.01, 0.05, 0.1];

   const loadHistory = async () => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, provider);
    const events = await contract.queryFilter(contract.filters.BetPlaced(), 0, "latest");

    const userEvents = events
      .filter(ev => ev.args.player.toLowerCase() === userAddress.toLowerCase())
      .map(ev => ({
        block: ev.blockNumber,
        amount: Number(ethers.utils.formatEther(ev.args.amount)),
        side: ev.args.side ? "heads" : "tails",
        win: ev.args.win,
      }))
      .reverse();

    setBetHistory(userEvents);
  } catch (error) {
    console.error("Gagal memuat history:", error);
  }
};
  
  // Handle BET
  const handleBet = async () => {
  if (!signer) return alert("Connect wallet");
  isModalOpen.current = true;
  setShowModal(true);
  setModalPhase("submitting");
  setBetResult(null);
  setLastBetBlock(null);
  setLoading(true);

  try {
       // 1️⃣ Switch otomatis ke Irys Testnet
       await switchToIrys();
    setStatus("Connected to Irys, preparing transaction...");
      const contract = new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, signer);

      const txObj = await contract.flip(choice === "heads", {
        value: ethers.utils.parseEther(amount.toString())
      });

      const receipt = await txObj.wait();
      const blockNumber = receipt.blockNumber;

      const events = await contract.queryFilter(contract.filters.BetPlaced(), blockNumber, blockNumber);

      const myEvent = events.find(ev => ev.args.player.toLowerCase() === userAddress.toLowerCase());

      if (!isModalOpen.current) return; // <-- Tambahan penting

      if (myEvent) {
        const win = myEvent.args.win;
        setBetResult(win ? "win" : "lose");
        setModalPhase("result");
        setLastBetBlock(blockNumber);
        loadHistory();
      } else {
        setBetResult(null);
        setModalPhase("result");
      }

      setLoading(false);
    });
     setLoading(false);
  } catch (e) {
    if (!isModalOpen.current) return; // <-- Tambahan penting
    setBetResult(null);
    setModalPhase("result");
    setLoading(false);
  }
};

const handleCloseModal = () => {
  setShowModal(false);
  setLoading(false);
  setModalPhase("submitting");
  setBetResult(null);
  setTxid(null);
  setLastBetBlock(null);
  isModalOpen.current = false; // <-- Tambahan penting
};
 useEffect(() => {
    if (provider && userAddress) {
      loadHistory();
    }
  }, [provider, userAddress]);
  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-2"
      style={{
        backgroundImage: "url('/pixel-landscape.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        imageRendering: "pixelated",
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(18,18,18,0.7)",
          zIndex: 0,
        }}
      ></div>

      {/* CARD UTAMA */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "#151515ee",
          border: "4px solid #444",
          borderRadius: 12,
          boxShadow: "0 6px 0 #222",
          maxWidth: 500,
          width: "96vw",
          margin: "34px auto 18px auto",
          padding: "26px 34px 28px 34px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        {/* Judul */}
        <div style={{
          ...fontPixel,
          color: "#fff",
          fontSize: 24,
          letterSpacing: 1,
          marginBottom: 12,
          borderBottom: "3px solid #333",
          paddingBottom: 8,
          textAlign: "left",
          width: "100%"
        }}>
          play
        </div>
        {/* Wallet Address */}
        <div style={{
          ...fontPixel,
          color: "#16f06c",
          fontSize: 13,
          textAlign: "left",
          marginBottom: 5,
          marginTop: 6,
          letterSpacing: "0.08em",
          width: "100%"
        }}>
          {userAddress && (
            <>Wallet: {userAddress.slice(0, 7)}...{userAddress.slice(-4)}</>
          )}
        </div>

        {/* Coin Pixel Animasi */}
        <div style={{ margin: "14px auto 16px auto", minHeight: 120 }}>
          <img
            src="/coin_pixel.png"
            alt="Coin"
            style={{
              width: 120,
              height: 120,
              display: "block",
              imageRendering: "pixelated",
              transition: "transform 1s cubic-bezier(.68,-0.55,.27,1.55)",
              transform: animating ? "rotateY(720deg)" : "none"
            }}
          />
        </div>

        {/* Heads or tails */}
        <div style={{ ...fontPixel, margin: "10px 0 6px", fontSize: 15, color: "#fff", textAlign: "center" }}>
          Heads or tails?
        </div>
        {/* Tombol Heads/Tails */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "14px 0 20px" }}>
          <button
            onClick={() => setChoice("heads")}
            disabled={loading}
            style={{
              ...fontPixel,
              padding: "13px 24px",
              background: choice === "heads" ? "#16f06c" : "#111",
              color: choice === "heads" ? "#111" : "#16f06c",
              border: "3px solid #16f06c",
              borderRadius: 7,
              fontSize: 17,
              boxShadow: choice === "heads" ? "0 0 12px #16f06c" : "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "0.18s"
            }}>
            HEADS
          </button>
          <button
            onClick={() => setChoice("tails")}
            disabled={loading}
            style={{
              ...fontPixel,
              padding: "13px 24px",
              background: choice === "tails" ? "#16f06c" : "#111",
              color: choice === "tails" ? "#111" : "#16f06c",
              border: "3px solid #16f06c",
              borderRadius: 7,
              fontSize: 17,
              boxShadow: choice === "tails" ? "0 0 12px #16f06c" : "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "0.18s"
            }}>
            TAILS
          </button>
        </div>
        {/* Amount */}
        <div style={{ ...fontPixel, margin: "16px 0 8px", fontSize: 15, color: "#fff", textAlign: "center" }}>
          Amount to bet
        </div>
        <div style={{ display: "flex", gap: 14, marginBottom: 20, justifyContent: "center" }}>
          {betOptions.map(num => (
            <button
              key={num}
              onClick={() => setAmount(num)}
              disabled={loading}
              style={{
                ...fontPixel,
                width: 97,
                height: 54,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                background: amount === num ? "#16f06c" : "#111",
                color: amount === num ? "#111" : "#16f06c",
                border: "3px solid #16f06c",
                borderRadius: 10,
                boxShadow: amount === num ? "0 0 12px #16f06c" : "none",
                cursor: loading ? "not-allowed" : "pointer",
                padding: 0,
                margin: 0,
                transition: "0.18s"
              }}
            >{num}</button>
          ))}
        </div>
        <div style={{ textAlign: "center", marginBottom: 8, ...fontPixel, fontSize: 13, color: "#aaa" }}>
          or
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <input
            type="number"
            min={0.001}
            step={0.01}
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            style={{
              ...fontPixel,
              width: 90,
              height: 38,
              fontSize: 16,
              background: "#222",
              color: "#16f06c",
              border: "3px solid #16f06c",
              borderRadius: 7,
              outline: "none",
              padding: "0 10px",
              textAlign: "center"
            }}
          />
        </div>
        {/* Tombol BET */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
          <button
            onClick={handleBet}
            disabled={loading || animating}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              background: "#ffb04a",
              color: "#111",
              border: "3px solid #fff",
              borderRadius: 7,
              fontSize: 32,
              minWidth: 180,
              padding: "12px 0",
              cursor: loading ? "wait" : "pointer",
              boxShadow: "0 2px 0 #111",
              opacity: loading ? 0.7 : 1,
              transition: "0.2s",
              textAlign: "center"
            }}
          >
            {loading ? "BETTING..." : "BET"}
          </button>
        </div>
      </div>
     {/* Riwayat Taruhan */}
{betHistory.length > 0 && (
  <div
    style={{
      width: "100%",
      display: "flex",
      justifyContent: "center",
      marginTop: 16,
      marginLeft: "auto",
      marginRight: "auto"
    }}
  >
    <div
      style={{
        background: "rgba(0,0,0,0.38)",
        borderRadius: 10,
        padding: "12px 30px",
        fontFamily: "'Fira Mono', 'Consolas', 'Courier New', monospace",
        fontSize: "18px",
        color: "#fff",
        lineHeight: "1.32em",
        letterSpacing: "0.03em",
        width: "100%",
        maxWidth: 500,  // SAMAKAN dengan card utama
        minWidth: 0,
        whiteSpace: "pre",
        textAlign: "left",
        boxShadow: "0 0 10px #0007",
        boxSizing: "border-box",
        margin: "0 auto" // FULL tengah
      }}
    >
      {betHistory.slice(0, 10).map((entry, idx) => {
        const wallet = `${userAddress.slice(0, 7)}...${userAddress.slice(-4)}`;
        const amount = entry.amount.toFixed(2).padEnd(5, " ");
        const side = entry.side.padEnd(6, " ");
        const result = entry.win
          ? <span style={{color: "#10ff10", fontWeight: 600}}>WIN </span>
          : <span style={{color: "#ff5555", fontWeight: 600}}>LOSE</span>;
        const block = entry.block.toString().padStart(6, " ");
        return (
          <div key={idx}>
            {wallet} {amount} {side}{result}{block}
          </div>
        );
      })}
    </div>
  </div>
)}


      {/* ResultModal */}
     {showModal && (
  <ResultModal
    phase={modalPhase}
    winner={betResult === "win"}
    onClose={handleCloseModal}
    score={null}
    txid={txid}
  />
)}
    </div>
  );
}
