import React, { useState } from "react";
import CoinflipForm from "./CoinflipForm";

export default function Dashboard({ wallet, irys }) {
  const [balance, setBalance] = useState(100); // saldo dummy
  const [history, setHistory] = useState([]);

  const handleBet = async (choice, amount) => {
    if (amount > balance || amount <= 0) {
      alert("Saldo tidak cukup atau nominal salah!");
      return;
    }
    const result = Math.random() < 0.5 ? "heads" : "tails";
    const win = result === choice;
    const newBalance = win ? balance + amount : balance - amount;
    setBalance(newBalance);

    const betData = {
      address: wallet.address,
      amount,
      choice,
      result,
      win,
      timestamp: Date.now(),
    };
    setHistory([betData, ...history]);

    // Simpan hasil ke Irys (optional)
    try {
      await irys.upload(JSON.stringify(betData));
    } catch (e) {
      console.log("Upload ke Irys gagal", e);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-xl font-bold mb-4">
        Wallet: <span className="text-gray-600">{wallet.address.slice(0,8)}...{wallet.address.slice(-4)}</span>
      </h2>
      <div className="mb-4">
        Saldo: <span className="font-semibold">{balance} Coin</span>
      </div>
      <CoinflipForm onBet={handleBet} />
      <div className="mt-6">
        <h3 className="font-bold mb-2">History</h3>
        <ul className="space-y-2">
          {history.length === 0 && (
            <li className="text-gray-400">Belum ada taruhan.</li>
          )}
          {history.map((bet, idx) => (
            <li key={idx} className={`p-2 rounded-lg ${bet.win ? "bg-green-100" : "bg-red-100"}`}>
              {bet.choice} ({bet.amount}) → <b>{bet.result}</b> | {bet.win ? "Menang" : "Kalah"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
