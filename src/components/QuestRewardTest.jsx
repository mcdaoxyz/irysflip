import React, { useState } from 'react';
import QuestRewardModal from './QuestRewardModal';

export default function QuestRewardTest() {
  const [showModal, setShowModal] = useState(false);
  const [modalPhase, setModalPhase] = useState('claiming');

  const handleTestClaiming = () => {
    setShowModal(true);
    setModalPhase('claiming');
    
    // Simulate claiming process
    setTimeout(() => {
      setModalPhase('success');
    }, 3000);
  };

  const handleTestSuccess = () => {
    setShowModal(true);
    setModalPhase('success');
  };

  const handleTestError = () => {
    setShowModal(true);
    setModalPhase('error');
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Press Start 2P', monospace",
      padding: '20px'
    }}>
      <h1 style={{
        color: '#fff',
        fontSize: '24px',
        marginBottom: '40px',
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>
        Quest Reward Modal Test
      </h1>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        maxWidth: '400px',
        width: '100%'
      }}>
        <button
          onClick={handleTestClaiming}
          style={{
            padding: '15px 20px',
            fontSize: '14px',
            background: '#16f06c',
            color: '#111',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            fontWeight: 'bold',
            boxShadow: '0 4px 0 #0f8f4c',
            transition: 'all 0.2s'
          }}
          onMouseDown={e => e.currentTarget.style.boxShadow = '0 2px 0 #0f8f4c'}
          onMouseUp={e => e.currentTarget.style.boxShadow = '0 4px 0 #0f8f4c'}
        >
          Test Claiming Process
        </button>
        
        <button
          onClick={handleTestSuccess}
          style={{
            padding: '15px 20px',
            fontSize: '14px',
            background: '#ffb04a',
            color: '#111',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            fontWeight: 'bold',
            boxShadow: '0 4px 0 #d8942a',
            transition: 'all 0.2s'
          }}
          onMouseDown={e => e.currentTarget.style.boxShadow = '0 2px 0 #d8942a'}
          onMouseUp={e => e.currentTarget.style.boxShadow = '0 4px 0 #d8942a'}
        >
          Test Success Animation
        </button>
        
        <button
          onClick={handleTestError}
          style={{
            padding: '15px 20px',
            fontSize: '14px',
            background: '#ff4444',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: "'Press Start 2P', monospace",
            fontWeight: 'bold',
            boxShadow: '0 4px 0 #cc3333',
            transition: 'all 0.2s'
          }}
          onMouseDown={e => e.currentTarget.style.boxShadow = '0 2px 0 #cc3333'}
          onMouseUp={e => e.currentTarget.style.boxShadow = '0 4px 0 #cc3333'}
        >
          Test Error State
        </button>
      </div>

      <div style={{
        marginTop: '40px',
        padding: '20px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.2)',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        <h3 style={{
          color: '#fff',
          fontSize: '16px',
          marginBottom: '15px'
        }}>
          Features:
        </h3>
        <ul style={{
          color: '#ccc',
          fontSize: '12px',
          textAlign: 'left',
          lineHeight: '1.6'
        }}>
          <li>✨ Uses irysreward.gif for animated reward display</li>
          <li>🌟 Enhanced particle effects with stars and circles</li>
          <li>💫 Pulsing glow effect around the reward coin</li>
          <li>🎯 Dynamic text animations with glow effects</li>
          <li>🎨 Smooth transitions and pop animations</li>
          <li>🎮 Pixel art style consistent with the game</li>
        </ul>
      </div>

      <QuestRewardModal
        isOpen={showModal}
        onClose={handleCloseModal}
        claimedQuests={['Daily Login', 'Daily Flip', 'Weekly Flips']}
        totalAmount={0.0256}
        phase={modalPhase}
      />
    </div>
  );
} 