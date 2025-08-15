import React, { useState, useEffect } from "react";
import Login from "./Login";
import DashboardOnchain from "./DashboardOnchain";
import QuestPage from "./QuestPage";
import HistoryPage from "./components/HistoryPage";
import { clearAllLocalQuestData } from "./utils/clearLocalData";
import { initializeAutoQuestReset, cleanupAutoQuestReset } from "./utils/questSystem";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#1a1a1a',
          color: '#fff',
          fontFamily: "'Press Start 2P', monospace",
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#ff5555', marginBottom: '20px' }}>⚠️ Something went wrong</h1>
          <p style={{ marginBottom: '20px', fontSize: '12px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#16f06c',
              color: '#111',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 20px',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: "'Press Start 2P', monospace"
            }}
          >
            RELOAD PAGE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}


export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletProvider, setWalletProvider] = useState(null);
  const [walletSigner, setWalletSigner] = useState(null);
  const [irysUploader, setIrysUploader] = useState(null);


  const handleLogin = () => {
    setLoggedIn(true);
  };

  const handleWalletConnected = (address, provider, signer, irys) => {
    setWalletAddress(address);
    setWalletProvider(provider);
    setWalletSigner(signer);
    setIrysUploader(irys);
  };

  const handleWalletDisconnected = () => {
    setWalletAddress(null);
    setWalletProvider(null);
    setWalletSigner(null);
    setIrysUploader(null);
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleGoToQuest = () => {
    setCurrentPage('quest');
  };

  const handleGoToHistory = () => {
    setCurrentPage('history');
  };

  // Clear local quest data on app startup to ensure we use smart contract data only
  useEffect(() => {
    try {
      clearAllLocalQuestData();
      console.log('App started - local quest data cleared, using smart contract data only');
    } catch (error) {
      console.warn('Failed to clear local quest data on app startup:', error);
    }
  }, []);

  // Initialize automatic quest reset system globally
  useEffect(() => {
    if (walletAddress) {
      initializeAutoQuestReset(walletAddress);
    }
    
    // Cleanup on unmount
    return () => {
      cleanupAutoQuestReset();
    };
  }, [walletAddress]);

  return (
    <ErrorBoundary>
      <div>
        {!loggedIn ? (
          <Login onLogin={handleLogin} />
        ) : currentPage === 'quest' ? (
                  <QuestPage 
            onBackToDashboard={handleBackToDashboard} 
            walletAddress={walletAddress}
            walletProvider={walletProvider}
            walletSigner={walletSigner}
          />
        ) : currentPage === 'history' ? (
          <HistoryPage 
            onBackToDashboard={handleBackToDashboard} 
            walletAddress={walletAddress}
            walletProvider={walletProvider}
            walletSigner={walletSigner}
          />
        ) : (
          <DashboardOnchain 
            onGoToQuest={handleGoToQuest}
            onGoToHistory={handleGoToHistory}
            onWalletConnected={handleWalletConnected}
            onWalletDisconnected={handleWalletDisconnected}
            walletAddress={walletAddress}
            walletProvider={walletProvider}
            walletSigner={walletSigner}
            irysUploader={irysUploader}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

