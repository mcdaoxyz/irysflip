import React, { useState } from "react";

export default function CoinflipForm({ onBet }) {
  const [choice, setChoice] = useState("heads");
  const [amount, setAmount] = useState(0);

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-xl ${
            choice === "heads" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setChoice("heads")}
        >
          Heads
        </button>
        <button
          className={`px-4 py-2 rounded-xl ${
            choice === "tails" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setChoice("tails")}
        >
          Tails
        </button>
      </div>
      <input
        type="number"
        min={1}
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        className="border rounded-xl px-3 py-2 mt-2"
        placeholder="Nominal taruhan"
      />
      <button
        onClick={() => onBet(choice, amount)}
        className="w-full bg-green-500 text-white rounded-xl px-4 py-2 mt-2"
      >
        Flip Coin
      </button>
    </div>
  );
}
