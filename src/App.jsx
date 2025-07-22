import React, { useState } from "react";
import Login from "./Login";
import Dashboard from "./Dashboard";
import { createIrys } from "./utils/irys";

function App() {
  const [wallet, setWallet] = useState(null);
  const [irys, setIrys] = useState(null);

  const handleLogin = async (walletObj) => {
    setWallet(walletObj);
    const irysInstance = createIrys(walletObj.signer);
    setIrys(irysInstance);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {!wallet || !irys ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard wallet={wallet} irys={irys} />
      )}
    </div>
  );
}

export default App;
