import React, { useState, useEffect } from "react";

export default function QuestRewardModal({ 
  isOpen, 
  onClose, 
  claimedQuests, 
  totalAmount, 
  phase = "claiming" // "claiming", "success", "error"
}) {
  const [coinAnimation, setCoinAnimation] = useState(false);
  const [particleAnimation, setParticleAnimation] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Trigger animations when modal opens
  useEffect(() => {
    if (isOpen && phase === "success") {
      setCoinAnimation(true);
      setParticleAnimation(true);
      
      // Stop coin animation after 3 seconds
      const coinTimer = setTimeout(() => setCoinAnimation(false), 3000);
      // Stop particle animation after 4 seconds
      const particleTimer = setTimeout(() => setParticleAnimation(false), 4000);
      
      return () => {
        clearTimeout(coinTimer);
        clearTimeout(particleTimer);
      };
    }
  }, [isOpen, phase]);

  // Reset image states when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [isOpen]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 200,
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Claiming Phase */}
      {phase === "claiming" && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 20
          }}
        >
          <div style={{
            position: 'relative',
            width: 120,
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Fallback loading spinner */}
            {!imageLoaded && !imageError && (
              <div style={{
                width: '60px',
                height: '60px',
                border: '4px solid rgba(22,240,108,0.3)',
                borderTop: '4px solid #16f06c',
                borderRadius: '50%',
                animation: 'questSpin 1s linear infinite'
              }}></div>
            )}
            
            {/* Fallback coin icon */}
            {imageError && (
              <div style={{
                width: '60px',
                height: '60px',
                background: '#16f06c',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                color: '#111',
                fontWeight: 'bold',
                animation: 'questFloat 1.4s ease-in-out infinite'
              }}>
                $
              </div>
            )}
            
            {/* Optimized IRYS GIF with transparent background */}
            <img
              src="/irys.gif"
              alt="IRYS Reward Loading"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                imageRendering: 'pixelated',
                animation: imageLoaded ? 'questFloat 1.4s ease-in-out infinite' : 'none',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.3s ease',
                mixBlendMode: 'normal',
                filter: 'drop-shadow(0 4px 8px rgba(22,240,108,0.3))'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            
            {/* Spinning ring around the coin */}
            <div style={{
              position: 'absolute',
              top: -10,
              left: -10,
              width: 140,
              height: 140,
              border: '3px solid #16f06c',
              borderTop: '3px solid transparent',
              borderRadius: '50%',
              animation: 'questSpin 1s linear infinite',
              opacity: imageLoaded ? 1 : 0.5
            }}></div>
          </div>
          <div style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 14,
            color: '#16f06c',
            textShadow: '0 0 8px rgba(22,240,108,0.5)',
            textAlign: 'center'
          }}>
            Claiming Quest Rewards...
          </div>
        </div>
      )}

      {/* Success Phase */}
      {phase === "success" && (
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
              zIndex: 10,
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#333c'}
            onMouseLeave={e => e.currentTarget.style.background = '#222c'}
          >
            ✖
          </button>

          {/* Main Reward Animation */}
          <div style={{
            position: 'relative',
            width: 200,
            height: 200,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Pulsing glow effect */}
            <div style={{
              position: 'absolute',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(22,240,108,0.3) 0%, rgba(22,240,108,0.1) 50%, transparent 70%)',
              animation: 'questPulse 2s ease-in-out infinite',
              filter: 'blur(8px)'
            }}></div>
            
            {/* Fallback loading spinner for success */}
            {!imageLoaded && !imageError && (
              <div style={{
                width: '100px',
                height: '100px',
                border: '6px solid rgba(22,240,108,0.3)',
                borderTop: '6px solid #16f06c',
                borderRadius: '50%',
                animation: 'questSpin 1s linear infinite'
              }}></div>
            )}
            
            {/* Fallback coin for success */}
            {imageError && (
              <div style={{
                width: '100px',
                height: '100px',
                background: '#16f06c',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                color: '#111',
                fontWeight: 'bold',
                animation: coinAnimation ? 'questRewardFlip 2s ease-in-out' : 'questRewardFloat 3s ease-in-out infinite',
                filter: 'drop-shadow(0 8px 16px rgba(22,240,108,0.3))'
              }}>
                $
              </div>
            )}
            
            {/* Optimized IRYS Reward Coin with transparent background */}
            <img
              src="/irys.gif"
              alt="IRYS Reward"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                imageRendering: 'pixelated',
                animation: imageLoaded ? (coinAnimation ? 'questRewardFlip 2s ease-in-out' : 'questRewardFloat 3s ease-in-out infinite') : 'none',
                transform: imageLoaded && coinAnimation ? 'rotateY(720deg) scale(1.5)' : 'rotateY(0deg) scale(1)',
                filter: 'drop-shadow(0 8px 16px rgba(22,240,108,0.3))',
                transition: 'transform 0.3s ease, opacity 0.3s ease',
                opacity: imageLoaded ? 1 : 0,
                mixBlendMode: 'normal'
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            {/* Enhanced Particle effects */}
            {particleAnimation && imageLoaded && (
              <>
                {/* Star particles */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`star-${i}`}
                    style={{
                      position: 'absolute',
                      width: '12px',
                      height: '12px',
                      background: '#16f06c',
                      clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                      animation: `questStarParticle ${1.5 + i * 0.1}s ease-out forwards`,
                      animationDelay: `${i * 0.05}s`,
                      transform: `rotate(${i * 30}deg) translateY(-140px)`,
                      filter: 'drop-shadow(0 0 4px #16f06c)'
                    }}
                  />
                ))}
                {/* Circle particles */}
                {[...Array(6)].map((_, i) => (
                  <div
                    key={`circle-${i}`}
                    style={{
                      position: 'absolute',
                      width: '6px',
                      height: '6px',
                      background: '#ffb04a',
                      borderRadius: '50%',
                      animation: `questCircleParticle ${1.2 + i * 0.15}s ease-out forwards`,
                      animationDelay: `${i * 0.08}s`,
                      transform: `rotate(${i * 60}deg) translateY(-100px)`,
                      filter: 'drop-shadow(0 0 3px #ffb04a)'
                    }}
                  />
                ))}
              </>
            )}
          </div>

          {/* Success Text */}
          <div style={{
            position: 'absolute',
            bottom: 120,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#16f06c',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 18,
            fontWeight: 'bold',
            textShadow: '0 0 10px rgba(22,240,108,0.5)',
            animation: 'questTextGlow 2s ease-in-out infinite'
          }}>
            REWARD CLAIMED!
          </div>

          {/* Amount Display */}
          <div style={{
            position: 'absolute',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#fff',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 16,
            fontWeight: 'bold',
            animation: 'questAmountPop 0.5s ease-out 0.5s both'
          }}>
            +{totalAmount.toFixed(4)} IRYS
          </div>

          {/* Quest List */}
          {claimedQuests && claimedQuests.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: 50,
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              color: '#888',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 10
            }}>
              {claimedQuests.join(', ')}
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: "#16f06c",
              color: "#111",
              fontSize: 12,
              padding: "10px 20px",
              borderRadius: 8,
              border: 0,
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              fontWeight: 'bold',
              boxShadow: '0 4px 0 #0f8f4c',
              transition: 'all 0.2s'
            }}
            onMouseDown={e => e.currentTarget.style.boxShadow = '0 2px 0 #0f8f4c'}
            onMouseUp={e => e.currentTarget.style.boxShadow = '0 4px 0 #0f8f4c'}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateX(-50%) scale(1)'}
          >
            CONTINUE
          </button>
        </div>
      )}

      {/* Error Phase */}
      {phase === "error" && (
        <div
          style={{
            background: "rgba(24,24,24,0.95)",
            borderRadius: 20,
            maxWidth: 420,
            width: '92vw',
            boxShadow: '0 10px 28px #111a',
            padding: '38px 20px 32px 20px',
            textAlign: 'center',
            position: 'relative',
            color: "#fff",
            backdropFilter: "blur(2px)",
            border: "1.2px solid #ff4444"
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
          <div
            style={{
              fontWeight: 900,
              fontSize: 18,
              marginBottom: 16,
              color: "#ff4444",
              fontFamily: "'Press Start 2P', monospace"
            }}
          >
            Claim Failed
          </div>
          <div style={{ color: "#e0e0e0", fontSize: 12, marginBottom: 24, lineHeight: 1.4 }}>
            Failed to claim quest rewards. Please try again.
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#ff4444",
              color: "#fff",
              fontSize: 12,
              padding: "10px 20px",
              borderRadius: 8,
              border: 0,
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              fontWeight: 'bold',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#ff6666'}
            onMouseLeave={e => e.currentTarget.style.background = '#ff4444'}
          >
            OK
          </button>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes questFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        
        @keyframes questSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes questRewardFlip {
          0% { transform: rotateY(0deg) scale(1); }
          25% { transform: rotateY(180deg) scale(1.3); }
          50% { transform: rotateY(360deg) scale(1.5); }
          75% { transform: rotateY(540deg) scale(1.3); }
          100% { transform: rotateY(720deg) scale(1); }
        }
        
        @keyframes questRewardFloat {
          0%, 100% { transform: translateY(0px) rotateY(0deg); }
          25% { transform: translateY(-15px) rotateY(10deg); }
          50% { transform: translateY(-25px) rotateY(0deg); }
          75% { transform: translateY(-15px) rotateY(-10deg); }
        }
        
        @keyframes questStarParticle {
          0% {
            opacity: 1;
            transform: rotate(var(--rotation)) translateY(-140px) scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.8;
            transform: rotate(var(--rotation)) translateY(-180px) scale(1.2) rotate(180deg);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotation)) translateY(-220px) scale(0) rotate(360deg);
          }
        }
        
        @keyframes questCircleParticle {
          0% {
            opacity: 1;
            transform: rotate(var(--rotation)) translateY(-100px) scale(1);
          }
          50% {
            opacity: 0.7;
            transform: rotate(var(--rotation)) translateY(-150px) scale(1.5);
          }
          100% {
            opacity: 0;
            transform: rotate(var(--rotation)) translateY(-200px) scale(0);
          }
        }
        
        @keyframes questPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.1);
            opacity: 1;
          }
        }
        
        @keyframes questTextGlow {
          0%, 100% {
            textShadow: '0 0 10px rgba(22,240,108,0.5)';
            transform: translateX(-50%) scale(1);
          }
          50% {
            textShadow: '0 0 20px rgba(22,240,108,0.8), 0 0 30px rgba(22,240,108,0.4)';
            transform: translateX(-50%) scale(1.05);
          }
        }
        
        @keyframes questAmountPop {
          0% {
            opacity: 0;
            transform: translateX(-50%) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translateX(-50%) scale(1.2);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
}