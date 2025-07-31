import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getEnhancedGasFee, formatGasFee, compareGasFees } from '../utils/gasUtils';

export default function GasFeeInfo({ provider, gasMultiplier, onFeeUpdate }) {
  const [feeInfo, setFeeInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (provider && gasMultiplier) {
      updateFeeInfo();
    }
  }, [provider, gasMultiplier]);

  const updateFeeInfo = async () => {
    if (!provider) return;
    
    setLoading(true);
    try {
      const enhancedFee = await getEnhancedGasFee(provider, gasMultiplier);
      setFeeInfo(enhancedFee);
      
      if (onFeeUpdate) {
        onFeeUpdate(enhancedFee);
      }
    } catch (error) {
      console.error('Error updating fee info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!provider) return null;

  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #333',
      borderRadius: 8,
      padding: '12px',
      marginBottom: '15px',
      fontFamily: "'Press Start 2P', monospace"
    }}>
      <div style={{
        fontSize: '10px',
        color: '#fff',
        marginBottom: '8px',
        textAlign: 'center'
      }}>
        Gas Fee Info
      </div>
      
      {loading ? (
        <div style={{
          fontSize: '9px',
          color: '#888',
          textAlign: 'center'
        }}>
          Loading...
        </div>
      ) : feeInfo ? (
        <div style={{ fontSize: '8px', color: '#ccc' }}>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: '#16f06c' }}>Enhanced:</span> {formatGasFee(feeInfo)}
          </div>
          {feeInfo.originalFeeData && (
            <div style={{ marginBottom: '6px' }}>
              <span style={{ color: '#888' }}>Original:</span> {formatGasFee(feeInfo.originalFeeData)}
            </div>
          )}
          <div style={{ fontSize: '7px', color: '#666', textAlign: 'center', marginTop: '6px' }}>
            Multiplier: {gasMultiplier}x
          </div>
        </div>
      ) : (
        <div style={{
          fontSize: '9px',
          color: '#888',
          textAlign: 'center'
        }}>
          No fee data available
        </div>
      )}
    </div>
  );
} 