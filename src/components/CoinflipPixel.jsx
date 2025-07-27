import React, { useState } from "react";

const coinEmoji = ["🪙", "🎲"];

export default function CoinflipPixel({ onBet, disabled }) {
  const [choice, setChoice] = useState("heads");
  const [amount, setAmount] = useState("");

  return (
    <div className="pixel-card" style={{textAlign:'center'}}>
      <h1 style={{color:'#fff05a', fontSize:'1.1rem', marginBottom:'1.2rem'}}>
        IRYS COINFLIP <span style={{fontSize:'2rem'}}>{coinEmoji[0]}</span>
      </h1>
      <div style={{marginBottom:'1.4rem'}}>
        <button
          className={`pixel-btn ${choice === "heads" ? "shadow-pixel" : ""}`}
          style={{
            borderColor: choice === "heads" ? "#ff92fa" : "#fff05a",
            background: choice === "heads" ? "#ff92fa" : "#232044",
            color: choice === "heads" ? "#232044" : "#fff"
          }}
          onClick={() => setChoice("heads")}
        >
          HEADS
        </button>
        <button
          className={`pixel-btn ${choice === "tails" ? "shadow-pixel" : ""}`}
          style={{
            borderColor: choice === "tails" ? "#39c1ff" : "#fff05a",
            background: choice === "tails" ? "#39c1ff" : "#232044",
            color: choice === "tails" ? "#232044" : "#fff"
          }}
          onClick={() => setChoice("tails")}
        >
          TAILS
        </button>
      </div>
      <input
        type="number"
        min={0.001}
        className="pixel-input"
        placeholder="BET AMOUNT (IRYS)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        disabled={disabled}
      />
      <br/>
      <button
        className="pixel-btn"
        style={{
          background: "#fff05a",
          borderColor: "#fff05a",
          color: "#232044",
          marginTop:'0.7rem'
        }}
        onClick={() => onBet(choice, amount)}
        disabled={disabled || !amount || parseFloat(amount)<=0}
      >
        FLIP!
      </button>
    </div>
  );
}
