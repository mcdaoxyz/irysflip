import React, { useState } from "react";
import CoinflipPixel from "./CoinflipPixel";

export default function DashboardPixel({ wallet, betOnchain }) {
  const [balance, setBalance] = useState("??");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleBet = async (choice, amount) => {
    if (loading) return;
    setLoading(true);
    try {
      // panggil betOnchain (dari parent, connect ke smart contract)
      const result = await betOnchain(choice, amount);
      setHistory([result, ...history]);
    } catch (err) {
      alert(err.message || "Bet failed");
    }
    setLoading(false);
  };

  return (
    <div>
      <div className="pixel-card" style={{marginTop:'2rem'}}>
        <div style={{fontSize:'0.7rem', color:'#0aff9d', marginBottom:'0.4rem'}}>
          {wallet?.address?.slice(0,8)}...{wallet?.address?.slice(-4)}
        </div>
        <div style={{fontSize:'0.9rem', color:'#fff'}}>
          Balance: <b style={{color:'#fff05a'}}>{balance} IRYS</b>
        </div>
      </div>
      <CoinflipPixel onBet={handleBet} disabled={loading} />
      <div className="pixel-card" style={{marginTop:'2rem', background:'#262236'}}>
        <h2 style={{color:'#39c1ff', fontSize:'1rem', marginBottom:'1rem'}}>BET HISTORY</h2>
        {history.length === 0 && <div style={{color:'#888', fontSize:'0.8rem'}}>No bets yet.</div>}
        <ul style={{padding:0, listStyle:'none'}}>
          {history.map((h, i) => (
            <li key={i} style={{marginBottom:'0.7rem', color: h.win ? "#0aff9d" : "#ff6464"}}>
              {h.amount} IRYS | {h.choice.toUpperCase()} - {h.win ? "WIN 🎉" : "LOSE"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
