import React, { useState } from "react";
import Login from "./Login";
import DashboardOnchain from "./DashboardOnchain";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  // Tidak perlu lagi menerima argumen dari Login
  const handleLogin = () => {
    setLoggedIn(true);
  };

  return (
    <div>
      {!loggedIn ? (
        <Login onLogin={handleLogin} />
      ) : (
        <DashboardOnchain />
      )}
    </div>
  );
}
