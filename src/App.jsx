import React, { useState } from "react";
import Login from "./Login";
import DashboardOnchain from "./DashboardOnchain";

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [userAddress, setUserAddress] = useState(null);

  const handleLogin = async ({ provider, signer, address }) => {
    setProvider(provider);
    setSigner(signer);
    setUserAddress(address);
  };

  return (
    <div>
      {!provider || !signer || !userAddress ? (
        <Login onLogin={handleLogin} />
      ) : (
        <DashboardOnchain
          provider={provider}
          signer={signer}
          userAddress={userAddress}
        />
      )}
    </div>
  );
}
