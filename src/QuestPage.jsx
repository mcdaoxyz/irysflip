import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  getPlayerQuestStatus,
  completeDailyLoginOnContract,
  checkQuestCompletionStatus,
  claimQuestReward,
  canClaimQuestReward,
  getQuestRewardAmount,
  getQuestRequirements,
  getTotalAvailableRewards,
  clearAllLocalQuestData,
  initializeAutoQuestReset,
  cleanupAutoQuestReset,
  QUEST_TYPES
} from './utils/questSystem';
import { COINFLIP_ABI } from './utils/coinflipABI';
import QuestRewardModal from './components/QuestRewardModal';

const CONTRACT_ADDRESS = "0xC9F9A1e0C2822663e31c0fCdF46aF0dc10081423";

export default function QuestPage({ onBackToDashboard, walletAddress, walletProvider, walletSigner }) {
  const [questStatus, setQuestStatus] = useState(null);
  const [requirements, setRequirements] = useState({ dailyFlip: 10, weeklyFlips: 7, monthlyStreak: 30 });
  const [claimable, setClaimable] = useState({
    [QUEST_TYPES.DAILY_LOGIN]: false,
    [QUEST_TYPES.DAILY_FLIP]: false,
    [QUEST_TYPES.WEEKLY_FLIPS]: false,
    [QUEST_TYPES.MONTHLY_STREAK]: false,
  });
  const [amounts, setAmounts] = useState({
    [QUEST_TYPES.DAILY_LOGIN]: "0",
    [QUEST_TYPES.DAILY_FLIP]: "0",
    [QUEST_TYPES.WEEKLY_FLIPS]: "0",
    [QUEST_TYPES.MONTHLY_STREAK]: "0",
  });
  const [totalRewards, setTotalRewards] = useState(0);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [completingQuest, setCompletingQuest] = useState(null);
  const [claimingQuest, setClaimingQuest] = useState(null);

  // Quest Reward Modal states
  const [showQuestRewardModal, setShowQuestRewardModal] = useState(false);
  const [questRewardModalPhase, setQuestRewardModalPhase] = useState("claiming");
  const [claimedQuests, setClaimedQuests] = useState([]);
  const [claimedAmount, setClaimedAmount] = useState(0);

  // Handle close quest reward modal
  const handleCloseQuestRewardModal = () => {
    setShowQuestRewardModal(false);
    setQuestRewardModalPhase("claiming");
    setClaimedAmount(0);
    setClaimedQuests([]);
  };

  // Initialize contract when wallet is connected
  useEffect(() => {
    const initContract = async () => {
      if (walletSigner) {
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, walletSigner);
        setContract(contractInstance);
      } else {
        setContract(null);
      }
    };

    initContract();
  }, [walletSigner]);

  // Clear local quest data on mount to ensure we use smart contract data only
  useEffect(() => {
    if (walletAddress) {
      clearAllLocalQuestData();
      console.log('Local quest data cleared - using smart contract data only');
    }
  }, [walletAddress]);

  // Refresh quest data from smart contract
  const refreshQuestData = async () => {
    if (!walletAddress || !window?.ethereum) return;
    
    setLoading(true);
    try {
      // Get quest status from smart contract
      const status = await getPlayerQuestStatus(walletAddress);
      setQuestStatus(status);

      // Get requirements from smart contract
      const reqs = await getQuestRequirements();
      setRequirements(reqs);

      // Get contract instance for canClaim + amount
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, provider);

      const types = [
        QUEST_TYPES.DAILY_LOGIN,
        QUEST_TYPES.DAILY_FLIP,
        QUEST_TYPES.WEEKLY_FLIPS,
        QUEST_TYPES.MONTHLY_STREAK,
      ];

      const can = {};
      const amts = {};
      for (const t of types) {
        can[t] = await canClaimQuestReward(contractInstance, walletAddress, t);
        const raw = await getQuestRewardAmount(contractInstance, walletAddress, t);
        amts[t] = ethers.formatEther(raw ?? 0n);
      }

      setClaimable(can);
      setAmounts(amts);

      // Calculate total available rewards
      let total = 0;
      for (const [k, v] of Object.entries(can)) {
        if (v) {
          // Additional validation for monthly streak - must have 30 days
          if (k === QUEST_TYPES.MONTHLY_STREAK) {
            const monthlyStreak = parseInt(status?.monthlyStreak || '0');
            if (monthlyStreak < 30) {
              console.log('Monthly streak excluded from total rewards: need 30 days, have', monthlyStreak);
              continue; // Skip adding to total
            }
          }
          total += parseFloat(amts[k] || "0");
        }
      }
      setTotalRewards(total);

    } catch (error) {
      console.error('Error refreshing quest data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data refresh and periodic refresh
  useEffect(() => {
    refreshQuestData();
    
    // Initialize automatic quest reset system
    if (walletAddress) {
      initializeAutoQuestReset(walletAddress);
    }
    
    // Cleanup on unmount
    return () => {
      cleanupAutoQuestReset();
    };
  }, [walletAddress]);

  const handleDailyLogin = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first to access quests!');
      return;
    }

    setCompletingQuest('daily_login');
    setLoading(true);
    try {
      const result = await completeDailyLoginOnContract();
      if (result.success) {
        console.log('Daily login completed successfully');
        await refreshQuestData(); // Refresh to get updated status
        } else {
        alert('Failed to complete daily login: ' + result.message);
      }
    } catch (error) {
      console.error('Error completing daily login:', error);
        alert('Failed to complete daily login quest: ' + error.message);
    } finally {
      setLoading(false);
      setCompletingQuest(null);
    }
  };

  const handleClaimAllRewards = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first!');
      return;
    }

    // Show claiming modal
    setShowQuestRewardModal(true);
    setQuestRewardModalPhase("claiming");
    setClaimingQuest('all');
    
    try {
      console.log('Claiming all available rewards from smart contract...');
      
      let totalClaimed = 0;
      const claimedQuests = [];
      
      // Check and claim each quest reward
      const questTypes = [
        { type: QUEST_TYPES.DAILY_LOGIN, name: 'Daily Login' },
        { type: QUEST_TYPES.DAILY_FLIP, name: 'Daily Flip' },
        { type: QUEST_TYPES.WEEKLY_FLIPS, name: 'Weekly Flips' },
        { type: QUEST_TYPES.MONTHLY_STREAK, name: 'Monthly Streak' }
      ];
      
      for (const quest of questTypes) {
        if (claimable[quest.type]) {
          // Additional validation for monthly streak
          if (quest.type === QUEST_TYPES.MONTHLY_STREAK) {
            const monthlyStreak = parseInt(questStatus.monthlyStreak || '0');
            if (monthlyStreak < 30) {
              console.log('Monthly streak requirement not met: need 30 days, have', monthlyStreak);
              continue; // Skip claiming this quest
            }
          }
          
          try {
            const result = await claimQuestReward(quest.type);
            if (result.success) {
              totalClaimed += parseFloat(result.amount);
              claimedQuests.push(quest.name);
            } else {
              console.log(`${quest.name} claim failed:`, result.message);
          }
        } catch (error) {
            console.error(`Error claiming ${quest.name} reward:`, error);
          }
        }
      }
      
      // Refresh quest data after claiming
      await refreshQuestData();
      
      // Show success modal
      if (totalClaimed > 0) {
        setClaimedAmount(totalClaimed);
        setClaimedQuests(claimedQuests);
        setQuestRewardModalPhase("success");
      } else {
        setQuestRewardModalPhase("error");
      }
      
    } catch (error) {
      console.error('Error claiming rewards:', error);
      setQuestRewardModalPhase("error");
    } finally {
      setClaimingQuest(null);
    }
  };

  const getQuestIcon = (questType) => {
    switch (questType) {
      case 'daily_login':
        return '🌅';
      case 'daily_flip':
        return '🪙';
      case 'weekly_flips':
        return '📅';
      case 'monthly_streak':
        return '🔥';
      default:
        return '❓';
    }
  };

  const getQuestColor = (completed, canClaim) => {
    if (completed) return '#16f06c';
    if (canClaim) return '#ffb04a';
    return '#666';
  };

  const getQuestProgress = (current, required) => {
    return Math.min((current / required) * 100, 100);
  };

  if (!questStatus) {
    return (
      <div
        className="min-h-screen flex flex-col justify-center items-center px-2"
        style={{
          backgroundImage: "url('/pixel-landscape.jpg')",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          imageRendering: "pixelated",
          minHeight: "100vh",
          width: "100vw",
          position: "relative",
          fontFamily: "'Press Start 2P', monospace",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(18,18,18,0.7)",
            zIndex: 0,
          }}
        ></div>
        
        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "#151515ee",
            border: "4px solid #444",
            borderRadius: 12,
            boxShadow: "0 6px 0 #222",
            maxWidth: 600,
            width: "96vw",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <div style={{
            fontSize: "16px",
            color: "#fff",
            marginBottom: "12px"
          }}>
            🎯 QUEST CENTER
          </div>
          <div style={{
            fontSize: "12px",
            color: "#888"
          }}>
            {walletAddress ? "Loading quest data..." : "Connect wallet to view quests"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-2"
      style={{
        backgroundImage: "url('/pixel-landscape.jpg')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        imageRendering: "pixelated",
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        fontFamily: "'Press Start 2P', monospace",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(18,18,18,0.7)",
          zIndex: 0,
        }}
      ></div>

      {/* Header */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          background: "#151515ee",
          border: "4px solid #444",
          borderRadius: 12,
          boxShadow: "0 6px 0 #222",
          maxWidth: 600,
          width: "96vw",
          padding: "24px",
          marginBottom: "20px"
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }}>
          <h1 style={{
            fontSize: "24px",
            color: "#fff",
            margin: 0,
            textShadow: "2px 2px 0 #111"
          }}>
            🎯 QUEST CENTER
          </h1>
          <button
            onClick={onBackToDashboard}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "10px",
              background: "#222",
              color: "#16f06c",
              border: "2px solid #16f06c",
              borderRadius: 6,
              padding: "8px 12px",
              cursor: "pointer",
              boxShadow: "0 2px 0 #111",
              transition: "0.2s",
            }}
            onMouseDown={e => e.currentTarget.style.boxShadow = "none"}
            onMouseUp={e => e.currentTarget.style.boxShadow = "0 2px 0 #111"}
          >
            BACK
          </button>
        </div>

        {/* Wallet Info */}
        {walletAddress ? (
          <div style={{
            background: "#1a1a1a",
            border: "1px solid #333",
            borderRadius: 8,
            padding: "12px",
            marginBottom: "20px",
            fontSize: "10px",
            color: "#fff"
          }}>
            <div>Wallet: {walletAddress.slice(0, 7)}...{walletAddress.slice(-4)}</div>
            {totalRewards > 0 && (
              <div style={{ color: "#16f06c", marginTop: "4px" }}>
                Available Rewards: +{totalRewards.toFixed(2)} IRYS
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: "#1a1a1a",
            border: "1px solid #ff5555",
            borderRadius: 8,
            padding: "12px",
            marginBottom: "20px",
            fontSize: "10px",
            color: "#ff5555",
            textAlign: "center"
          }}>
            ⚠️ Please connect your wallet to access quests
          </div>
        )}

        {/* Quest Stats */}
        {walletAddress && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: "12px",
            marginBottom: "20px"
          }}>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>🌅</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Login Streak</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {questStatus.dailyLoginCompleted ? "1" : "0"} days
              </div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>🪙</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Flip Streak</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {questStatus.dailyFlipCompleted ? "1" : "0"} days
              </div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>📅</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Weekly Flips</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {questStatus.weeklyFlips}/{requirements.weeklyFlips}
              </div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>🔥</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Monthly Streak</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {questStatus.monthlyStreak}/30
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quest Cards */}
      {walletAddress ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "#151515ee",
            border: "4px solid #444",
            borderRadius: 12,
            boxShadow: "0 6px 0 #222",
            maxWidth: 600,
            width: "96vw",
            padding: "24px"
          }}
        >
          {/* Daily Login Quest */}
          <div style={{
            marginBottom: "20px",
            padding: "16px",
            background: "#222",
            borderRadius: 10,
            border: `3px solid ${getQuestColor(questStatus.dailyLoginCompleted, claimable[QUEST_TYPES.DAILY_LOGIN])}`
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "24px" }}>🌅</span>
                <div>
                  <div style={{
                    fontSize: "14px",
                    color: "#fff",
                    fontWeight: "bold"
                  }}>
                    Daily Login
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "#888"
                  }}>
                    Login to the app daily
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: "12px",
                color: getQuestColor(questStatus.dailyLoginCompleted, claimable[QUEST_TYPES.DAILY_LOGIN]),
                fontWeight: "bold"
              }}>
                +{parseFloat(amounts[QUEST_TYPES.DAILY_LOGIN] || "0").toFixed(2)} IRYS
              </div>
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{
                fontSize: "10px",
                color: "#888"
              }}>
                {questStatus.dailyLoginCompleted ? "Completed today" : "Tap complete to check-in"}
              </div>
              {!questStatus.dailyLoginCompleted ? (
                <button
                  onClick={handleDailyLogin}
                  disabled={loading || completingQuest === 'daily_login'}
                  style={{
                    fontSize: "10px",
                    background: "#ffb04a",
                    color: "#111",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: (loading || completingQuest === 'daily_login') ? "not-allowed" : "pointer",
                    opacity: (loading || completingQuest === 'daily_login') ? 0.6 : 1,
                    fontWeight: "bold"
                  }}
                >
                  {completingQuest === 'daily_login' ? "COMPLETING..." : "HIRYS"}
                </button>
              ) : claimable[QUEST_TYPES.DAILY_LOGIN] ? (
                <div style={{
                  fontSize: "10px",
                  color: "#16f06c",
                  fontWeight: "bold"
                }}>
                  COMPLETED
                </div>
              ) : (
                <div style={{
                  fontSize: "10px",
                  color: "#666",
                  fontWeight: "bold"
                }}>
                  CLAIMED
                </div>
              )}
            </div>
          </div>

          {/* Daily Flip Quest */}
          <div style={{
            marginBottom: "20px",
            padding: "16px",
            background: "#222",
            borderRadius: 10,
            border: `3px solid ${getQuestColor(questStatus.dailyFlipCompleted, claimable[QUEST_TYPES.DAILY_FLIP])}`
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "24px" }}>🪙</span>
                <div>
                  <div style={{
                    fontSize: "14px",
                    color: "#fff",
                    fontWeight: "bold"
                  }}>
                    Daily Flip
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "#888"
                  }}>
                    Make {requirements.dailyFlip} flips daily
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: "12px",
                color: getQuestColor(questStatus.dailyFlipCompleted, claimable[QUEST_TYPES.DAILY_FLIP]),
                fontWeight: "bold"
              }}>
                +{parseFloat(amounts[QUEST_TYPES.DAILY_FLIP] || "0").toFixed(2)} IRYS
              </div>
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{
                fontSize: "10px",
                color: "#888"
              }}>
                {questStatus.dailyFlipsToday}/{requirements.dailyFlip} flips today
              </div>
              {questStatus.dailyFlipCompleted ? (
                claimable[QUEST_TYPES.DAILY_FLIP] ? (
                <div style={{
                  fontSize: "10px",
                  color: "#16f06c",
                  fontWeight: "bold"
                }}>
                    COMPLETED
                </div>
                ) : (
                  <div style={{
                    fontSize: "10px",
                    color: "#666",
                    fontWeight: "bold"
                  }}>
                    CLAIMED
                  </div>
                )
              ) : (
                <div style={{
                  fontSize: "10px",
                  color: "#666",
                  fontWeight: "bold"
                }}>
                  IN PROGRESS
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div style={{
              width: "100%",
              height: "6px",
              background: "#333",
              borderRadius: 3,
              overflow: "hidden",
              marginTop: "8px"
            }}>
              <div style={{
                width: `${getQuestProgress(parseInt(questStatus.dailyFlipsToday), requirements.dailyFlip)}%`,
                height: "100%",
                background: "#16f06c",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>

          {/* Weekly Flips Quest */}
          <div style={{
            marginBottom: "20px",
            padding: "16px",
            background: "#222",
            borderRadius: 10,
            border: `3px solid ${getQuestColor(questStatus.weeklyFlipsCompleted, claimable[QUEST_TYPES.WEEKLY_FLIPS])}`
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "24px" }}>📅</span>
                <div>
                  <div style={{
                    fontSize: "14px",
                    color: "#fff",
                    fontWeight: "bold"
                  }}>
                    Weekly Flips
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "#888"
                  }}>
                    Make {requirements.weeklyFlips} flips this week
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: "12px",
                color: getQuestColor(questStatus.weeklyFlipsCompleted, claimable[QUEST_TYPES.WEEKLY_FLIPS]),
                fontWeight: "bold"
              }}>
                +{parseFloat(amounts[QUEST_TYPES.WEEKLY_FLIPS] || "0").toFixed(2)} IRYS
              </div>
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{
                fontSize: "10px",
                color: "#888"
              }}>
                {questStatus.weeklyFlips}/{requirements.weeklyFlips} flips
              </div>
              {questStatus.weeklyFlipsCompleted ? (
                claimable[QUEST_TYPES.WEEKLY_FLIPS] ? (
                <div style={{
                  fontSize: "10px",
                  color: "#16f06c",
                  fontWeight: "bold"
                }}>
                    COMPLETED
                </div>
                ) : (
                  <div style={{
                    fontSize: "10px",
                    color: "#666",
                    fontWeight: "bold"
                  }}>
                    CLAIMED
                  </div>
                )
              ) : (
                <div style={{
                  fontSize: "10px",
                  color: "#666",
                  fontWeight: "bold"
                }}>
                  IN PROGRESS
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div style={{
              width: "100%",
              height: "6px",
              background: "#333",
              borderRadius: 3,
              overflow: "hidden",
              marginTop: "8px"
            }}>
              <div style={{
                width: `${getQuestProgress(parseInt(questStatus.weeklyFlips), requirements.weeklyFlips)}%`,
                height: "100%",
                background: "#16f06c",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>

          {/* Monthly Streak Quest */}
          <div style={{
            marginBottom: "20px",
            padding: "16px",
            background: "#222",
            borderRadius: 10,
            border: `3px solid ${getQuestColor(questStatus.monthlyStreakCompleted, claimable[QUEST_TYPES.MONTHLY_STREAK])}`
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px"
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}>
                <span style={{ fontSize: "24px" }}>🔥</span>
                <div>
                  <div style={{
                    fontSize: "14px",
                    color: "#fff",
                    fontWeight: "bold"
                  }}>
                    Monthly Streak
                  </div>
                  <div style={{
                    fontSize: "10px",
                    color: "#888"
                  }}>
                    Login for 30 days straight
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: "12px",
                color: getQuestColor(questStatus.monthlyStreakCompleted, claimable[QUEST_TYPES.MONTHLY_STREAK]),
                fontWeight: "bold"
              }}>
                +{parseFloat(amounts[QUEST_TYPES.MONTHLY_STREAK] || "0").toFixed(2)} IRYS
              </div>
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{
                fontSize: "10px",
                color: "#888"
              }}>
                {questStatus.monthlyStreak}/30 days
              </div>
              {(() => {
                // Client-side validation for monthly streak - must have 30 days
                const monthlyStreak = parseInt(questStatus.monthlyStreak || '0');
                const hasRequiredStreak = monthlyStreak >= 30;
                const canActuallyClaim = claimable[QUEST_TYPES.MONTHLY_STREAK] && hasRequiredStreak;
                
                if (questStatus.monthlyStreakCompleted && canActuallyClaim) {
                  return (
                <div style={{
                  fontSize: "10px",
                  color: "#16f06c",
                  fontWeight: "bold"
                }}>
                      COMPLETED
                </div>
                  );
                } else if (questStatus.monthlyStreakCompleted) {
                  return (
                    <div style={{
                      fontSize: "10px",
                      color: "#666",
                      fontWeight: "bold"
                    }}>
                      CLAIMED
                    </div>
                  );
                } else {
                  return (
                <div style={{
                  fontSize: "10px",
                  color: "#666",
                  fontWeight: "bold"
                }}>
                  IN PROGRESS
                </div>
                  );
                }
              })()}
            </div>
            
            {/* Progress bar */}
            <div style={{
              width: "100%",
              height: "6px",
              background: "#333",
              borderRadius: 3,
              overflow: "hidden",
              marginTop: "8px"
            }}>
              <div style={{
                width: `${getQuestProgress(parseInt(questStatus.monthlyStreak), 30)}%`,
                height: "100%",
                background: "#16f06c",
                transition: "width 0.3s ease"
              }} />
            </div>
          </div>

          {/* Claim All Rewards Button */}
          {totalRewards > 0 && (
            <div style={{
              marginTop: "20px",
              padding: "16px",
              background: "#1a1a1a",
              border: "2px solid #16f06c",
              borderRadius: 10,
              textAlign: "center"
            }}>
              <div style={{
                fontSize: "12px",
                color: "#16f06c",
                marginBottom: "12px",
                fontWeight: "bold"
              }}>
                Available Rewards: +{totalRewards.toFixed(2)} IRYS
              </div>
              <button
                onClick={handleClaimAllRewards}
                disabled={claimingQuest === 'all'}
                style={{
                  fontSize: "12px",
                  background: "#16f06c",
                  color: "#111",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 24px",
                  cursor: claimingQuest === 'all' ? "not-allowed" : "pointer",
                  opacity: claimingQuest === 'all' ? 0.6 : 1,
                  fontWeight: "bold",
                  width: "100%"
                }}
              >
                {claimingQuest === 'all' ? "CLAIMING..." : "CLAIM REWARD"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "#151515ee",
            border: "4px solid #444",
            borderRadius: 12,
            boxShadow: "0 6px 0 #222",
            maxWidth: 600,
            width: "96vw",
            padding: "24px",
            textAlign: "center"
          }}
        >
          <div style={{
            fontSize: "16px",
            color: "#ff5555",
            marginBottom: "12px"
          }}>
            🔒 Quest Access Restricted
          </div>
          <div style={{
            fontSize: "12px",
            color: "#888"
          }}>
            Please connect your wallet to view and complete quests
          </div>
        </div>
      )}
      
       {/* Quest Reward Modal */}
       <QuestRewardModal
        isOpen={showQuestRewardModal}
        onClose={handleCloseQuestRewardModal}
        claimedQuests={claimedQuests}
        totalAmount={claimedAmount}
        phase={questRewardModalPhase}
      />
    </div>
  );
}