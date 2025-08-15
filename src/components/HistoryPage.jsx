import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { COINFLIP_ABI, CONTRACT_ADDRESS } from '../utils/coinflipABI';

export default function HistoryPage({ onBackToDashboard, walletAddress, walletProvider }) {
  const [betHistory, setBetHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWins: 0,
    totalLosses: 0,
    totalWagered: 0,
    totalWon: 0,
    winRate: 0
  });

  const BLOCK_RANGE = 50000; // Safe block range to avoid RPC limits

  // Load bet history with proper block range handling
  const loadHistory = async () => {
    if (!walletProvider || !walletAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, walletProvider);
      
      // Get current block number
      const currentBlock = await walletProvider.getBlockNumber();
      
      // Start from current block and go backwards in chunks
      let allEvents = [];
      let endBlock = currentBlock;
      let startBlock = Math.max(0, endBlock - BLOCK_RANGE);
      
      while (startBlock >= 0) {
        console.log(`Loading blocks ${startBlock} to ${endBlock}`);
        
        // Query events for this block range
        const events = await contract.queryFilter(
          contract.filters.BetPlaced(), 
          startBlock, 
          endBlock
        );
        
        // Filter events for current user
        const userEvents = events
          .filter(ev => ev.args.player.toLowerCase() === walletAddress.toLowerCase())
          .map(ev => ({
            block: ev.blockNumber,
            txHash: ev.transactionHash,
            amount: Number(ethers.formatEther(ev.args.amount)),
            side: ev.args.side ? "heads" : "tails",
            win: ev.args.win,
            timestamp: null
          }));
        
        allEvents = [...allEvents, ...userEvents];
        
        // Move to next block range
        endBlock = startBlock - 1;
        startBlock = Math.max(0, endBlock - BLOCK_RANGE);
        
        // Stop if we've loaded enough events or reached the beginning
        if (allEvents.length > 1000 || endBlock < 0) break;
      }
      
      // Sort by block number (newest first) and get timestamps
      const sortedEvents = allEvents
        .sort((a, b) => b.block - a.block)
        .slice(0, 100); // Limit to 100 most recent events
      
      // Get timestamps for blocks
      const eventsWithTimestamps = await Promise.all(
        sortedEvents.map(async (event) => {
          try {
            const block = await walletProvider.getBlock(event.block);
            return {
              ...event,
              timestamp: block.timestamp
            };
          } catch (error) {
            return {
              ...event,
              timestamp: null
            };
          }
        })
      );
      
      setBetHistory(eventsWithTimestamps);
      
    } catch (error) {
      console.error("Error loading history:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update statistics
  const updateStats = () => {
    const totalBets = betHistory.length;
    const totalWins = betHistory.filter(bet => bet.win).length;
    const totalLosses = totalBets - totalWins;
    const totalWagered = betHistory.reduce((sum, bet) => sum + bet.amount, 0);
    const totalWon = betHistory.filter(bet => bet.win).reduce((sum, bet) => sum + bet.amount * 2, 0);
    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
    
    setStats({
      totalBets,
      totalWins,
      totalLosses,
      totalWagered,
      totalWon,
      winRate
    });
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  // Format amount
  const formatAmount = (amount) => {
    return `${amount.toFixed(3)} IRYS`;
  };

  // Get transaction URL
  const getTxUrl = (txHash) => {
    return `https://testnet-explorer.irys.xyz/tx/${txHash}`;
  };

  // Initial load
  useEffect(() => {
    if (walletAddress && walletProvider) {
      loadHistory();
    }
  }, [walletAddress, walletProvider]);

  // Update stats when history changes
  useEffect(() => {
    updateStats();
  }, [betHistory]);

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
          maxWidth: 800,
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
            📊 BET HISTORY
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
            ⚠️ Please connect your wallet to view history
          </div>
        )}

        {/* Statistics */}
        {walletAddress && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
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
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>🎯</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Total Bets</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {stats.totalBets}
              </div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>✅</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Wins</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {stats.totalWins}
              </div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>❌</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Losses</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {stats.totalLosses}
              </div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>📈</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Win Rate</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {stats.winRate.toFixed(1)}%
              </div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>💰</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Total Wagered</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {formatAmount(stats.totalWagered)}
              </div>
            </div>
            <div style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: 8,
              padding: "12px",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "16px", marginBottom: "4px" }}>🏆</div>
              <div style={{ fontSize: "8px", color: "#fff" }}>Total Won</div>
              <div style={{ fontSize: "10px", color: "#16f06c" }}>
                {formatAmount(stats.totalWon)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History List */}
      {walletAddress ? (
        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: "#151515ee",
            border: "4px solid #444",
            borderRadius: 12,
            boxShadow: "0 6px 0 #222",
            maxWidth: 800,
            width: "96vw",
            padding: "24px"
          }}
        >
          {/* Error Message */}
          {error && (
            <div style={{
              background: "#2a1810",
              border: "1px solid #ff5555",
              borderRadius: 8,
              padding: "12px",
              marginBottom: "20px",
              fontSize: "10px",
              color: "#ff5555",
              textAlign: "center"
            }}>
              ⚠️ Error loading history: {error}
            </div>
          )}

          {/* Loading Message */}
          {loading && (
            <div style={{
              background: "#1a1a2e",
              border: "1px solid #4a90e2",
              borderRadius: 8,
              padding: "12px",
              marginBottom: "20px",
              fontSize: "10px",
              color: "#4a90e2",
              textAlign: "center"
            }}>
              🔄 Loading bet history...
            </div>
          )}

          {/* History Table */}
          {betHistory.length > 0 ? (
            <div style={{
              maxHeight: "400px",
              overflowY: "auto",
              border: "1px solid #333",
              borderRadius: 8,
              background: "#1a1a1a"
            }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "10px"
              }}>
                <thead style={{
                  background: "#222",
                  position: "sticky",
                  top: 0,
                  zIndex: 1
                }}>
                  <tr>
                    <th style={{
                      padding: "8px",
                      textAlign: "left",
                      color: "#fff",
                      borderBottom: "1px solid #333"
                    }}>Date</th>
                    <th style={{
                      padding: "8px",
                      textAlign: "left",
                      color: "#fff",
                      borderBottom: "1px solid #333"
                    }}>Amount</th>
                    <th style={{
                      padding: "8px",
                      textAlign: "left",
                      color: "#fff",
                      borderBottom: "1px solid #333"
                    }}>Side</th>
                    <th style={{
                      padding: "8px",
                      textAlign: "left",
                      color: "#fff",
                      borderBottom: "1px solid #333"
                    }}>Result</th>
                    <th style={{
                      padding: "8px",
                      textAlign: "left",
                      color: "#fff",
                      borderBottom: "1px solid #333"
                    }}>Block</th>
                    <th style={{
                      padding: "8px",
                      textAlign: "left",
                      color: "#fff",
                      borderBottom: "1px solid #333"
                    }}>TX</th>
                  </tr>
                </thead>
                <tbody>
                  {betHistory.map((bet, index) => (
                    <tr key={index} style={{
                      borderBottom: "1px solid #333",
                      background: index % 2 === 0 ? "#1a1a1a" : "#222"
                    }}>
                      <td style={{
                        padding: "8px",
                        color: "#fff",
                        fontSize: "9px"
                      }}>
                        {formatDate(bet.timestamp)}
                      </td>
                      <td style={{
                        padding: "8px",
                        color: "#16f06c",
                        fontSize: "9px"
                      }}>
                        {formatAmount(bet.amount)}
                      </td>
                      <td style={{
                        padding: "8px",
                        color: "#fff",
                        fontSize: "9px"
                      }}>
                        {bet.side.toUpperCase()}
                      </td>
                      <td style={{
                        padding: "8px",
                        color: bet.win ? "#16f06c" : "#ff5555",
                        fontSize: "9px",
                        fontWeight: "bold"
                      }}>
                        {bet.win ? "WIN" : "LOSE"}
                      </td>
                      <td style={{
                        padding: "8px",
                        color: "#888",
                        fontSize: "9px"
                      }}>
                        {bet.block}
                      </td>
                      <td style={{
                        padding: "8px",
                        fontSize: "9px"
                      }}>
                        <a
                          href={getTxUrl(bet.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: "#4a90e2",
                            textDecoration: "underline",
                            cursor: "pointer"
                          }}
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !loading && (
            <div style={{
              textAlign: "center",
              padding: "40px",
              color: "#888",
              fontSize: "12px"
            }}>
              No bet history found
            </div>
          )}

          {/* Refresh Button */}
          <div style={{
            marginTop: "20px",
            textAlign: "center"
          }}>
            <button
              onClick={() => loadHistory()}
              disabled={loading}
              style={{
                fontSize: "10px",
                background: "#333",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: 6,
                padding: "8px 16px",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "REFRESHING..." : "REFRESH"}
            </button>
          </div>
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
            maxWidth: 800,
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
            🔒 History Access Restricted
          </div>
          <div style={{
            fontSize: "12px",
            color: "#888"
          }}>
            Please connect your wallet to view bet history
          </div>
        </div>
      )}
    </div>
  );
} 