import React, { useState } from "react";

export default function CoinflipFormOnchain({ onBet, loading }) {
  const [choice, setChoice] = useState("heads");
  const [amount, setAmount] = useState("");

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <button className={choice === "heads" ? "bg-blue-500 text-white px-4 py-2 rounded" : "bg-gray-200 px-4 py-2 rounded"}
          onClick={() => setChoice("heads")}
          disabled={loading}>Heads</button>
        <button className={choice === "tails" ? "bg-blue-500 text-white px-4 py-2 rounded" : "bg-gray-200 px-4 py-2 rounded"}
          onClick={() => setChoice("tails")}
          disabled={loading}>Tails</button>
      </div>
      <input type="number" min={0} placeholder="Taruhan (dalam IRYS)" value={amount}
        onChange={e => setAmount(e.target.value)} className="border rounded px-3 py-2 mt-2" disabled={loading} />
      <button onClick={() => onBet(choice === "heads", amount)} className="w-full bg-green-500 text-white rounded px-4 py-2 mt-2" disabled={loading}>
        {loading ? "Sedang Taruhan..." : "Kirim Taruhan Onchain"}
      </button>
    </div>
  );
}
