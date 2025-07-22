import React, { useState } from "react";
import { connectOKXWallet } from "./utils/okxWallet";

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const wallet = await connectOKXWallet();
    setLoading(false);
    if (wallet) onLogin(wallet);
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-32">
      <h1 className="text-2xl font-bold">Login OKX Wallet</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white rounded-xl px-8 py-3 hover:bg-blue-600"
      >
        {loading ? "Connecting..." : "Connect OKX Wallet"}
      </button>
      <p className="text-gray-500 text-sm mt-2">
        Pastikan OKX Wallet extension sudah terpasang & login.
      </p>
    </div>
  );
}
