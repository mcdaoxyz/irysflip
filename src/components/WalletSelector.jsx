import React, { useState, useEffect } from 'react';
import { getAvailableWallets, connectWallet } from '../utils/walletDetector';

export default function WalletSelector({ onWalletConnected, onClose }) {
  const [availableWallets, setAvailableWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const wallets = getAvailableWallets();
    setAvailableWallets(wallets);
  }, []);

  const handleWalletSelect = async (wallet) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await connectWallet(wallet.provider);
      onWalletConnected(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoConnect = async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await connectWallet();
      onWalletConnected(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (availableWallets.length === 0) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: "'Press Start 2P', monospace"
      }}>
        <div style={{
          background: '#151515',
          border: '3px solid #444',
          borderRadius: 12,
          padding: '30px',
          maxWidth: 400,
          width: '90vw',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '16px' }}>
            No Wallet Detected
          </h3>
          <p style={{ color: '#ccc', fontSize: '12px', lineHeight: '1.4', marginBottom: '20px' }}>
            Please install one of the following wallets:
          </p>
          <div style={{ textAlign: 'left', fontSize: '11px', color: '#aaa' }}>
            <div>• MetaMask (🦊)</div>
            <div>• OKX Wallet (🟢)</div>
            <div>• Coinbase Wallet (🔵)</div>
            <div>• Trust Wallet (🟡)</div>
            <div>• Binance Wallet (🟠)</div>
            <div>• Brave Wallet (🦁)</div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginTop: '20px',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '11px',
              background: '#222',
              color: '#16f06c',
              border: '2px solid #16f06c',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      fontFamily: "'Press Start 2P', monospace"
    }}>
      <div style={{
        background: '#151515',
        border: '3px solid #444',
        borderRadius: 12,
        padding: '30px',
        maxWidth: 400,
        width: '90vw',
        textAlign: 'center'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '20px', fontSize: '16px' }}>
          Select Wallet
        </h3>
        
        {error && (
          <div style={{
            background: '#442222',
            border: '2px solid #ff4444',
            borderRadius: 6,
            padding: '10px',
            marginBottom: '20px',
            color: '#ff6666',
            fontSize: '11px'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleAutoConnect}
            disabled={loading}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '12px',
              background: '#16f06c',
              color: '#111',
              border: '2px solid #16f06c',
              borderRadius: 6,
              padding: '10px 20px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              width: '100%',
              marginBottom: '15px'
            }}
          >
            {loading ? 'Connecting...' : 'Auto Connect (Recommended)'}
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ color: '#ccc', fontSize: '11px', marginBottom: '10px' }}>
            Or choose specific wallet:
          </div>
          {availableWallets.map((wallet, index) => (
            <button
              key={index}
              onClick={() => handleWalletSelect(wallet)}
              disabled={loading}
              style={{
                fontFamily: "'Press Start 2P', monospace",
                fontSize: '11px',
                background: '#222',
                color: '#16f06c',
                border: '2px solid #16f06c',
                borderRadius: 6,
                padding: '8px 16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                width: '100%',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span>{wallet.icon}</span>
              <span>{wallet.name}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '10px',
            background: 'transparent',
            color: '#666',
            border: '1px solid #666',
            borderRadius: 4,
            padding: '6px 12px',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 