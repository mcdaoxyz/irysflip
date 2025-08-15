import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function ResultModal({ phase, score, winner, onClose, txid, gasFeeInfo }) {
  const isSubmitting = phase === "submitting";
  const [coinAnimation, setCoinAnimation] = useState(false);

  // Trigger coin animation when result phase starts
  useEffect(() => {
    if (phase === "result" && winner !== null) {
      setCoinAnimation(true);
      // Stop animation after 2 seconds
      const timer = setTimeout(() => setCoinAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [phase, winner]);

  return (
    <div
  style={{
    position: 'fixed',
    zIndex: 200,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.8)', // semi-transparent background
    backdropFilter: 'blur(6px)',  // blur latar belakang
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
        }}
      >
        {/* Saat SUBMITTING → hanya GIF IRYS sebagai loader dengan sedikit motion */}
        {isSubmitting && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 10
            }}
          >
            <img
  src="/irys.gif"
  alt="IRYS Loading"
  style={{
    width: 120,
    height: 'auto',
    imageRendering: 'pixelated',
    animation: 'floatY 1.4s ease-in-out infinite'
  }}
/>
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 14,
              color: '#fff',
              textShadow: '0 0 8px rgba(255,224,0,0.35)'
            }}>
              Submitting to Blockchain...
            </div>
          </div>
        )}

      {/* COIN ANIMATION ONLY - tanpa modal background */}
      {phase !== "submitting" && phase === "result" && (
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          position: 'relative'
        }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              right: 20,
              top: 20,
              fontSize: 20,
              background: '#222c',
              border: 0,
              borderRadius: 10,
              cursor: 'pointer',
              color: "#fff",
              padding: '8px 12px',
              zIndex: 10
            }}
          >
            ✖
          </button>

          {/* Main Coin Animation */}
          <div style={{
            position: 'relative',
            width: 200,
            height: 200,
            perspective: 1500,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img
              src={winner === true ? "/win.png" : "/lose.png"}
              alt={winner === true ? "Winning Coin" : "Losing Coin"}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                imageRendering: 'pixelated',
                animation: coinAnimation ? 'coinFlip 1.5s ease-in-out' : 'coinFloat 3s ease-in-out infinite',
                transform: coinAnimation ? 'rotateY(720deg) scale(1.3)' : 'rotateY(0deg) scale(1)',
                transformStyle: 'preserve-3d',
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                transition: 'transform 0.3s ease'
              }}
            />
          </div>

          {/* Result Text Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#fff',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 24,
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(0,0,0,0.8)'
          }}>
            {winner === true ? "YOU WON!" : "YOU LOST"}
          </div>

          {/* Back to Menu Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              bottom: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              background: "#23272f",
              color: "#fff",
              fontSize: 16,
              padding: "12px 30px",
              borderRadius: 10,
              border: 0,
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace"
            }}
          >
            Back to Menu
          </button>
        </div>
      )}

      {/* Saved Phase - keep original modal */}
      {phase === "saved" && (
        <div
          style={{
            background: "rgba(24,24,24,0.82)",
            borderRadius: 20,
            maxWidth: 420,
            width: '92vw',
            boxShadow: '0 10px 28px #111a',
            padding: '38px 0 32px 0',
            textAlign: 'center',
            position: 'relative',
            color: "#fff",
            backdropFilter: "blur(2px)",
            border: "1.2px solid #222"
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>💾</div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 22,
              marginBottom: 6,
              color: "#fff",
              fontFamily: "'Press Start 2P', monospace"
            }}
          >
            Result Saved!
          </div>
          <div style={{ color: "#e0e0e0", fontSize: 15, marginBottom: 18 }}>
            Your score: <b>{score}</b><br />Waiting for result confirmation...
          </div>
          <div style={{ margin: "28px auto 6px auto" }}>
            <div className="loading-anim" />
          </div>
          {gasFeeInfo && (
          <div style={{
            marginTop: 12,
            padding: "8px 12px",
            background: "#1a1a1a",
            borderRadius: 6,
            border: "1px solid #333",
            fontSize: "10px",
            fontFamily: "'Press Start 2P', monospace"
          }}>
            <div style={{ color: "#16f06c", marginBottom: "4px" }}>
              Gas Fee Used: {gasFeeInfo.maxFeePerGas ?
                `${Math.round(Number(ethers.formatUnits(gasFeeInfo.maxFeePerGas, 'gwei')))} gwei` :
                gasFeeInfo.gasPrice ?
                  `${Math.round(Number(ethers.formatUnits(gasFeeInfo.gasPrice, 'gwei')))} gwei` :
                  'Unknown'
              }
            </div>
            {gasFeeInfo.originalFeeData && (
              <div style={{ color: "#888", fontSize: "9px" }}>
                Original: {gasFeeInfo.originalFeeData.maxFeePerGas ?
                  `${Math.round(Number(ethers.formatUnits(gasFeeInfo.originalFeeData.maxFeePerGas, 'gwei')))} gwei` :
                  gasFeeInfo.originalFeeData.gasPrice ?
                    `${Math.round(Number(ethers.formatUnits(gasFeeInfo.originalFeeData.gasPrice, 'gwei')))} gwei` :
                    'Unknown'
                }
              </div>
            )}
          </div>
        )}
          {txid && (
          <div style={{ marginTop: 12 }}>
            <a
              href={`https://explorer.irys.xyz/tx/${txid}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#16f06c", fontSize: 13, textDecoration: "underline" }}
            >
              View on Irys Explorer
            </a>
          </div>
        )}
          </div>
        )}

      {/* CSS */}
      <style>{`
        .loading-anim {
          border: 4px solid #e0e0e0;
          border-top: 4px solid #ffe000;
          border-radius: 50%;
          width: 38px;
          height: 38px;
          animation: spin 0.7s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
        @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px) } }
        @keyframes coinFlip {
          0% { transform: rotateY(0deg) scale(1); }
          25% { transform: rotateY(180deg) scale(1.4); }
          50% { transform: rotateY(360deg) scale(1.2); }
          75% { transform: rotateY(540deg) scale(1.3); }
          100% { transform: rotateY(720deg) scale(1); }
        }
        @keyframes coinFloat {
          0%, 100% { transform: translateY(0px) rotateY(0deg); }
          25% { transform: translateY(-12px) rotateY(8deg); }
          50% { transform: translateY(-20px) rotateY(0deg); }
          75% { transform: translateY(-12px) rotateY(-8deg); }
        }
      `}</style>
    </div>
  );
}
