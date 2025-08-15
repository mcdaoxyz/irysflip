import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { COINFLIP_ABI } from "./utils/coinflipABI";
import ResultModal from "./components/ResultModal";
import WalletSelector from "./components/WalletSelector";
import GasFeeInfo from "./components/GasFeeInfo";
import MultiPlayerLobby from "./components/MultiPlayerLobby";
import MultiPlayerRoom from "./components/MultiPlayerRoom";
import { createEnhancedTxOptions, formatGasFee, compareGasFees } from "./utils/gasUtils";
import { clearAllLocalQuestData } from "./utils/clearLocalData";
import { createBotPlayers } from "./utils/botSystem";
import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { EthersV6Adapter } from "@irys/web-upload-ethereum-ethers-v6";

const CONTRACT_ADDRESS = "0xC9F9A1e0C2822663e31c0fCdF46aF0dc10081423";

export default function DashboardOnchain({ 
  onGoToQuest, 
  onGoToHistory,
  onWalletConnected, 
  onWalletDisconnected,
  walletAddress: propWalletAddress,
  walletProvider: propWalletProvider,
  walletSigner: propWalletSigner,
  irysUploader: propIrysUploader,

}) {
  // --- Wallet & Irys state ---
  const [walletAddress, setWalletAddress] = useState(propWalletAddress);
  const [irysUploader, setIrysUploader] = useState(propIrysUploader);
  const [provider, setProvider] = useState(propWalletProvider);
  const [signer, setSigner] = useState(propWalletSigner);

  // --- Game mode state ---
  const [gameMode, setGameMode] = useState("SINGLE");
  const [currentRoom, setCurrentRoom] = useState(null);

  // Update local state when props change
  useEffect(() => {
    setWalletAddress(propWalletAddress);
    setProvider(propWalletProvider);
    setSigner(propWalletSigner);
    setIrysUploader(propIrysUploader);
  }, [propWalletAddress, propWalletProvider, propWalletSigner, propIrysUploader]);

  // --- Game state ---
  const [choice, setChoice] = useState("heads");
  const [amount, setAmount] = useState(0.1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [animating, setAnimating] = useState(false);
  const [rewardConfirmed, setRewardConfirmed] = useState(false);
  const [lastBetBlock, setLastBetBlock] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [modalPhase, setModalPhase] = useState("submitting");
  const [betResult, setBetResult] = useState(null);
  const [txid, setTxid] = useState(null);
  const [showWalletSelector, setShowWalletSelector] = useState(false);
  const [gasFeeInfo, setGasFeeInfo] = useState(null);
  const [gasMultiplier, setGasMultiplier] = useState(1.5);
  const isModalOpen = useRef(false);

  const fontPixel = { fontFamily: "'Press Start 2P', monospace" };
  const betOptions = [0.01, 0.05, 0.1];

  // -------- CONNECT WALLET dengan multi-wallet support --------
  const connectWallet = async (walletResult) => {
    try {
      const { provider, signer, address } = walletResult;

    // Initialize Irys uploader with proper configuration
    let irys = null;
    try {
      // For now, skip Irys uploader to avoid compatibility issues
      console.log("Irys uploader temporarily disabled for compatibility");
    } catch (irysError) {
      console.warn("Irys uploader initialization failed, continuing without it:", irysError);
    }

    console.log("User address:", address);

    setWalletAddress(address);
    setProvider(provider);
    setSigner(signer);
    setIrysUploader(irys);
      setShowWalletSelector(false);
      
      // Notify parent component about wallet connection
      if (onWalletConnected) {
        onWalletConnected(address, provider, signer, irys);
      }
      

  } catch (err) {
    console.error("ERROR connectWallet:", err);
    alert("Wallet connect failed: " + (err.message || err));
  }
};

  const handleShowWalletSelector = () => {
    console.log("Wallet selector button clicked");
    setShowWalletSelector(true);
  };



  // Multi-player handlers
  const handleCreateRoom = (roomData) => {
    // Add bot players if room has bots
    if (roomData.hasBots && roomData.botCount > 0) {
      roomData.botPlayers = createBotPlayers(roomData.botCount, roomData.botDifficulty);
    }
    setCurrentRoom(roomData);
  };

  const handleJoinRoom = (room) => {
    setCurrentRoom(room);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
  };

  const handleBackToSingle = () => {
    setGameMode("SINGLE");
    setCurrentRoom(null);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIrysUploader(null);
    setProvider(null);
    setSigner(null);
    
    // Notify parent component about wallet disconnection
    if (onWalletDisconnected) {
      onWalletDisconnected();
    }
  };



  // ----------- HANDLE BET -----------
  const handleBet = async () => {
    if (!signer) return alert("Connect wallet");
    
    // Validate bet amount
    if (amount < 0.001 || amount > 0.1) {
      alert("Bet amount must be between 0.001 and 0.1 IRYS");
      return;
    }
    
    isModalOpen.current = true;
    setShowModal(true);
    setModalPhase("submitting");
    setBetResult(null);
    setLastBetBlock(null);
    setLoading(true);

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, signer);
      
      // Buat transaction options dengan gas fee yang ditingkatkan
      const txOptions = await createEnhancedTxOptions(
        provider, 
        contract, 
        'flip', 
        [choice === "heads"], 
        {
          value: ethers.parseEther(amount.toString()),
          gasMultiplier: gasMultiplier
        }
      );
      
      console.log('Enhanced gas fee:', formatGasFee(txOptions));
      console.log('Gas multiplier used:', gasMultiplier + 'x');
      console.log('Transaction options:', txOptions);
      
      // Simpan gas fee info untuk ditampilkan di modal
      setGasFeeInfo(txOptions);
      
      const txObj = await contract.flip(choice === "heads", txOptions);
      const receipt = await txObj.wait();
      

      const blockNumber = receipt.blockNumber;
      const events = await contract.queryFilter(contract.filters.BetPlaced(), blockNumber, blockNumber);
      const myEvent = events.find(ev => ev.args.player.toLowerCase() === walletAddress.toLowerCase());
      if (!isModalOpen.current) return;
      if (myEvent) {
        const win = myEvent.args.win;
        setBetResult(win ? "win" : "lose");
        setModalPhase("result");
        setLastBetBlock(blockNumber);
        
        // Quest tracking is now fully automatic through smart contract
        // No need to manually record flips - the contract handles everything
        console.log('Flip completed - quest progress updated automatically on smart contract');
        
        // Debug smart contract quest status after flip
        if (walletAddress) {
          import('./utils/questSystem.js').then(({ debugQuestStatus }) => {
            debugQuestStatus(walletAddress).then(status => {
              console.log('=== Smart contract quest status after flip ===', status);
            });
          });
        }
      } else {
        setBetResult(null);
        setModalPhase("result");
      }
      setLoading(false);
    } catch (e) {
      if (!isModalOpen.current) return;
      setBetResult(null);
      setModalPhase("result");
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setLoading(false);
    setModalPhase("submitting");
    setBetResult(null);
    setTxid(null);
    setLastBetBlock(null);
    isModalOpen.current = false;
  };



  // Clear any local quest data on component mount to ensure we use smart contract data only
  useEffect(() => {
    if (walletAddress) {
      try {
        clearAllLocalQuestData();
        console.log('Local quest data cleared - using smart contract data only');
      } catch (error) {
        console.warn('Failed to clear local quest data:', error);
      }
    }
  }, [walletAddress]);



  // --------- UI -----------
  return (
    <div
      className="min-h-screen flex flex-col"
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

      {/* Multi Mode Header */}
      {gameMode === "MULTI" && (
        <div style={{
          position: "relative",
          zIndex: 10,
          background: "#151515ee",
          borderBottom: "2px solid #333",
          padding: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          boxSizing: "border-box"
        }}>
          {/* Left side: Logo and Mode Switch */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}>
            {/* Logo */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <img 
                src="/irys.gif" 
                alt="Irys" 
                style={{
                  width: "24px",
                  height: "24px",
                  imageRendering: "pixelated"
                }}
              />
              <span style={{
                color: "#fff",
                fontSize: "16px",
                fontWeight: "bold",
                fontFamily: "'Press Start 2P', monospace"
              }}>
                Irys
              </span>
            </div>

            {/* Mode Switch */}
            <div style={{
              display: "flex",
              background: "#222",
              borderRadius: "8px",
              padding: "2px",
              border: "1px solid #333"
            }}>
              <button
                onClick={() => setGameMode("SINGLE")}
                style={{
                  background: gameMode === "SINGLE" ? "#16f06c" : "transparent",
                  color: gameMode === "SINGLE" ? "#111" : "#fff",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "10px",
                  fontFamily: "'Press Start 2P', monospace",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  minWidth: "60px"
                }}
              >
                Lite
              </button>
              <button
                disabled
                style={{
                  background: "transparent",
                  color: "#666",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "10px",
                  fontFamily: "'Press Start 2P', monospace",
                  fontWeight: "bold",
                  cursor: "not-allowed",
                  transition: "all 0.2s",
                  minWidth: "60px",
                  opacity: 0.5,
                  filter: "blur(0.5px)",
                  position: "relative"
                }}
              >
                <div style={{
                  position: "absolute",
                  top: "-20px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#ffb04a",
                  color: "#111",
                  fontSize: "8px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  zIndex: 10
                }}>
                  COMING SOON
                </div>
                Pro
              </button>
            </div>
          </div>

          {/* Center: Multi Mode Navigation */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "20px"
          }}>
            <span style={{
              color: "#16f06c",
              fontSize: "12px",
              fontFamily: "'Press Start 2P', monospace",
              cursor: "pointer"
            }}>
              Multi Player Mode
            </span>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer"
            }}>
              <span style={{
                color: "#888",
                fontSize: "12px",
                fontFamily: "'Press Start 2P', monospace"
              }}>
                Lobby
              </span>
            </div>
            {currentRoom && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                cursor: "pointer"
              }}>
                <span style={{
                  color: "#ffb04a",
                  fontSize: "12px",
                  fontFamily: "'Press Start 2P', monospace"
                }}>
                  Room: {currentRoom.name || "Game Room"}
                </span>
              </div>
            )}
          </div>

          {/* Right side: Connect Wallet Button */}
          <div>
            {!walletAddress ? (
              <button
                onClick={handleShowWalletSelector}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "10px",
                  background: "#222",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: 6,
                  padding: "8px 16px",
                  cursor: "pointer",
                  transition: "0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#333"}
                onMouseLeave={e => e.currentTarget.style.background = "#222"}
              >
                Connect wallet
              </button>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <span style={{
                  color: "#16f06c",
                  fontSize: "10px",
                  fontFamily: "'Press Start 2P', monospace"
                }}>
                  {walletAddress.slice(0, 7)}...{walletAddress.slice(-4)}
                </span>
                <button
                  onClick={disconnectWallet}
                  style={{
                    fontFamily: "'Press Start 2P', monospace",
                    fontSize: "8px",
                    background: "#ff4444",
                    color: "#fff",
                    border: "1px solid #ff4444",
                    borderRadius: 4,
                    padding: "4px 8px",
                    cursor: "pointer",
                    transition: "0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#ff6666"}
                  onMouseLeave={e => e.currentTarget.style.background = "#ff4444"}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px"
      }}>

      {/* Multi-player Mode */}
      {gameMode === "MULTI" && (
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "800px" }}>
          
          {currentRoom ? (
            <MultiPlayerRoom
              room={currentRoom}
              walletAddress={walletAddress}
              onLeaveRoom={handleLeaveRoom}
              onBet={handleBet}
              onBackToSingle={handleBackToSingle}
              provider={provider}
              signer={signer}
            />
          ) : (
            <MultiPlayerLobby
              walletAddress={walletAddress}
              onJoinRoom={handleJoinRoom}
              onCreateRoom={handleCreateRoom}
              onBackToSingle={handleBackToSingle}
            />
          )}
        </div>
      )}

      {/* Single Player Mode */}
      {gameMode === "SINGLE" && (
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 610,
          width: "100vw",
          margin: "34px auto 18px auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}
      >
        {/* Holder/Container Bar - like the second image */}
        <div style={{
          width: "100%",
          height: "4px",
          background: "linear-gradient(90deg, #2d4a2d 0%, #4a6b4a 50%, #2d4a2d 100%)",
          borderTop: "1px solid #1a2a1a",
          borderBottom: "1px solid #3a5a3a",
          marginBottom: "0px",
          borderRadius: "2px 2px 0 0"
        }}></div>
        
        <div
  style={{
    background: "#151515ee",
    border: "4px solid #444",
    borderRadius: "0 0 12px 12px",
    boxShadow: "0 6px 0 #222",
    width: "100%",
    padding: "26px 34px",        // Hilangkan padding bawah berlebihan
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "auto",              // Pastikan tinggi mengikuti konten
    boxSizing: "border-box"
  }}
>
          {/* Header with Logo and Mode Switch - integrated from first image */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginBottom: "20px"
          }}>
            {/* Left side: Logo and Mode Switch */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "20px"
            }}>
              {/* Logo */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <img 
                  src="/irys.gif" 
                  alt="Irys" 
                  style={{
                    width: "24px",
                    height: "24px",
                    imageRendering: "pixelated"
                  }}
                />
                <span style={{
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "bold",
                  fontFamily: "'Press Start 2P', monospace"
                }}>
                  IrysFlip
                </span>
              </div>

              {/* Mode Switch */}
              <div style={{
                display: "flex",
                background: "#222",
                borderRadius: "8px",
                padding: "2px",
                border: "1px solid #333"
              }}>
                <button
                  onClick={() => setGameMode("SINGLE")}
                  style={{
                    background: gameMode === "SINGLE" ? "#16f06c" : "transparent",
                    color: gameMode === "SINGLE" ? "#111" : "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "10px",
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: "bold",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    minWidth: "60px"
                  }}
                >
                  Lite
                </button>
                <button
                  disabled
                  style={{
                    background: "transparent",
                    color: "#666",
                    border: "1px solid #444",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "10px",
                    fontFamily: "'Press Start 2P', monospace",
                    fontWeight: "bold",
                    cursor: "not-allowed",
                    transition: "all 0.2s",
                    minWidth: "60px",
                    opacity: 0.5,
                    filter: "blur(0.5px)",
                    position: "relative"
                  }}
                >
                  <div style={{
                    position: "absolute",
                    top: "-20px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#ffb04a",
                    color: "#111",
                    fontSize: "8px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    whiteSpace: "nowrap",
                    zIndex: 10
                  }}>
                    COMING SOON
                  </div>
                  Pro
                </button>
              </div>
            </div>
          </div>

       
          {/* Header Divider Line */}
          <div style={{
            width: "100%",
            height: "2px",
            background: "linear-gradient(90deg, transparent 0%, #444 20%, #444 80%, transparent 100%)",
            marginBottom: "20px"
          }}></div>

        {/* Wallet Address & Button */}
        <div style={{
          ...fontPixel,
          color: "#16f06c",
          fontSize: 13,
          textAlign: "left",
          marginBottom: 5,
          marginTop: 6,
          letterSpacing: "0.08em",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "relative",
          zIndex: 5,
          pointerEvents: "auto"
        }}>
          {walletAddress ? (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{ fontSize: "11px", color: "#fff" }}>
        Wallet: {walletAddress.slice(0, 7)}...{walletAddress.slice(-4)}
      </span>

      </div>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: 10 }}>
      <button
        onClick={disconnectWallet}
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 11,
          background: "#222",
          color: "#16f06c",
          border: "2px solid #16f06c",
          borderRadius: 6,
          padding: "5px 12px",
          cursor: "pointer",
          boxShadow: "0 2px 0 #111",
          transition: "0.2s",
        }}
        onMouseDown={e => e.currentTarget.style.boxShadow = "none"}
        onMouseUp={e => e.currentTarget.style.boxShadow = "0 2px 0 #111"}
      >
        Disconnect
      </button>
        
        <button
          onClick={onGoToQuest}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 11,
            background: "#222",
            color: "#16f06c",
            border: "2px solid #16f06c",
            borderRadius: 6,
            padding: "5px 12px",
            cursor: "pointer",
            boxShadow: "0 2px 0 #111",
            transition: "0.2s",
          }}
          onMouseDown={e => e.currentTarget.style.boxShadow = "none"}
          onMouseUp={e => e.currentTarget.style.boxShadow = "0 2px 0 #111"}
        >
          🎯 QUEST
        </button>
        <button
          onClick={onGoToHistory}
          style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 11,
            background: "#222",
            color: "#16f06c",
            border: "2px solid #16f06c",
            borderRadius: 6,
            padding: "5px 12px",
            cursor: "pointer",
            boxShadow: "0 2px 0 #111",
            transition: "0.2s",
          }}
          onMouseDown={e => e.currentTarget.style.boxShadow = "none"}
          onMouseUp={e => e.currentTarget.style.boxShadow = "0 2px 0 #111"}
        >
          📊 HISTORY
        </button>
      </div>
    </>
  ) : (
    <button
      onClick={handleShowWalletSelector}
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 11,
        background: "#222",
        color: "#16f06c",
        border: "2px solid #16f06c",
        borderRadius: 6,
        padding: "5px 12px",
        cursor: "pointer",
        boxShadow: "0 2px 0 #111",
        transition: "0.2s",
        position: "relative",
        zIndex: 10,
        pointerEvents: "auto"
      }}
      onMouseDown={e => e.currentTarget.style.boxShadow = "none"}
      onMouseUp={e => e.currentTarget.style.boxShadow = "0 2px 0 #111"}
    >
      Connect Wallet
    </button>
  )}
</div>

        {/* Coin Pixel Animasi */}
        <div style={{ margin: "14px auto 16px auto", minHeight: 120 }}>
          <img
            src="/coin_pixel.png"
            alt="Coin"
            style={{
              width: 120,
              height: 120,
              display: "block",
              imageRendering: "pixelated",
              transition: "transform 1s cubic-bezier(.68,-0.55,.27,1.55)",
              transform: animating ? "rotateY(720deg)" : "none"
            }}
          />
        </div>

        {/* Gas Fee Settings */}
        {walletAddress && (
          <>
            <GasFeeInfo 
              provider={provider} 
              gasMultiplier={gasMultiplier}
              onFeeUpdate={(feeInfo) => setGasFeeInfo(feeInfo)}
            />
            <div style={{ marginBottom: 20, padding: "10px", background: "#1a1a1a", borderRadius: 8, border: "1px solid #333" }}>
              <div style={{ ...fontPixel, fontSize: 12, color: "#fff", marginBottom: 8, textAlign: "center" }}>
                Gas Fee Multiplier: {gasMultiplier}x
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.1"
                  value={gasMultiplier}
                  onChange={(e) => setGasMultiplier(parseFloat(e.target.value))}
                  style={{
                    flex: 1,
                    height: 6,
                    background: "#333",
                    borderRadius: 3,
                    outline: "none",
                    cursor: "pointer"
                  }}
                />
                <span style={{ ...fontPixel, fontSize: 10, color: "#16f06c", minWidth: 40 }}>
                  {gasMultiplier}x
                </span>
              </div>
              <div style={{ ...fontPixel, fontSize: 9, color: "#888", textAlign: "center" }}>
                Higher gas fee = faster transaction
              </div>
            </div>
          </>
        )}

        {/* Heads or tails */}
        <div style={{ ...fontPixel, margin: "10px 0 6px", fontSize: 15, color: "#fff", textAlign: "center" }}>
          Heads or tails?
        </div>
        {/* Tombol Heads/Tails */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "14px 0 20px" }}>
          <button
            onClick={() => setChoice("heads")}
            disabled={loading}
            style={{
              ...fontPixel,
              padding: "13px 24px",
              background: choice === "heads" ? "#16f06c" : "#111",
              color: choice === "heads" ? "#111" : "#16f06c",
              border: "3px solid #16f06c",
              borderRadius: 7,
              fontSize: 17,
              boxShadow: choice === "heads" ? "0 0 12px #16f06c" : "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "0.18s"
            }}>
            HEADS
          </button>
          <button
            onClick={() => setChoice("tails")}
            disabled={loading}
            style={{
              ...fontPixel,
              padding: "13px 24px",
              background: choice === "tails" ? "#16f06c" : "#111",
              color: choice === "tails" ? "#111" : "#16f06c",
              border: "3px solid #16f06c",
              borderRadius: 7,
              fontSize: 17,
              boxShadow: choice === "tails" ? "0 0 12px #16f06c" : "none",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "0.18s"
            }}>
            TAILS
          </button>
        </div>
        {/* Amount */}
        <div style={{ ...fontPixel, margin: "16px 0 8px", fontSize: 15, color: "#fff", textAlign: "center" }}>
          Amount to bet
        </div>
        <div style={{ ...fontPixel, margin: "4px 0 8px", fontSize: 10, color: "#888", textAlign: "center" }}>
          min 0.001 IRYS max 0.1 IRYS
        </div>
        <div style={{ display: "flex", gap: 14, marginBottom: 20, justifyContent: "center" }}>
          {betOptions.map(num => (
            <button
              key={num}
              onClick={() => setAmount(num)}
              disabled={loading}
              style={{
                ...fontPixel,
                width: 97,
                height: 54,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                background: amount === num ? "#16f06c" : "#111",
                color: amount === num ? "#111" : "#16f06c",
                border: "3px solid #16f06c",
                borderRadius: 10,
                boxShadow: amount === num ? "0 0 12px #16f06c" : "none",
                cursor: loading ? "not-allowed" : "pointer",
                padding: 0,
                margin: 0,
                transition: "0.18s"
              }}
            >{num}</button>
          ))}
        </div>
        <div style={{ textAlign: "center", marginBottom: 8, ...fontPixel, fontSize: 13, color: "#aaa" }}>
          or
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                    <input
            type="number"
              min="0.001"
              max="0.1"
              step="0.001"
            value={amount}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                // Enforce min/max limits
                if (value < 0.001) {
                  setAmount(0.001);
                } else if (value > 0.1) {
                  setAmount(0.1);
                } else {
                  setAmount(value);
                }
              }}
              disabled={loading}
            style={{
              ...fontPixel,
                width: 120,
                padding: "8px 12px",
              background: "#111",
              color: "#fff",
              border: "3px solid #16f06c",
              borderRadius: 7,
                fontSize: 16,
              textAlign: "center",
              outline: "none"
            }}
          />
        </div>



        <div style={{ display: "flex", justifyContent: "center", marginTop: 26 }}>
          <button
            onClick={handleBet}
            disabled={loading || animating || !walletAddress}
            style={{
              fontFamily: "'Press Start 2P', monospace",
              background: "#ffb04a",
              color: "#111",
              border: "3px solid #fff",
              borderRadius: 7,
              fontSize: 32,
              minWidth: 180,
              padding: "12px 0",
              cursor: loading ? "wait" : !walletAddress ? "not-allowed" : "pointer",
              boxShadow: "0 2px 0 #111",
              opacity: loading ? 0.7 : 1,
              transition: "0.2s",
              textAlign: "center"
            }}
          >
            {loading ? "BETTING..." : "BET"}
          </button>
        </div>
      </div>
      </div>
      )}


      {/* ResultModal */}
      {showModal && (
        <ResultModal
          phase={modalPhase}
          winner={betResult === "win"}
          onClose={handleCloseModal}
          score={null}
          txid={txid}
          gasFeeInfo={gasFeeInfo}
        />
      )}

      {/* WalletSelector Modal */}
      {showWalletSelector && (
        <WalletSelector
          onWalletConnected={connectWallet}
          onClose={() => setShowWalletSelector(false)}
        />
      )}
      </div>
    </div>
  );
}
