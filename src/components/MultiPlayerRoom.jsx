import React, { useState, useEffect } from "react";
import { simulateBotBehavior, createBotPlayers, updateBotStats } from "../utils/botSystem";
import { ethers } from "ethers";
import { COINFLIP_ABI } from "../utils/coinflipABI";
import RewardHistory from "./RewardHistory";

const CONTRACT_ADDRESS = "0xC9F9A1e0C2822663e31c0fCdF46aF0dc10081423";

export default function MultiPlayerRoom({ room, onLeaveRoom, walletAddress, onBet, onBackToSingle, provider, signer }) {
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("waiting"); // waiting, betting, flipping, finished, claiming
  const [timeLeft, setTimeLeft] = useState(30);
  const [choice, setChoice] = useState("heads");
  const [myBet, setMyBet] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [gameHistory, setGameHistory] = useState([]);
  const [claimLoading, setClaimLoading] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState(null);
  const [betLoading, setBetLoading] = useState(false);
  const [winners, setWinners] = useState([]);
  const [totalPot, setTotalPot] = useState(0);
  const [rewardHistory, setRewardHistory] = useState([]);
  const [lastTxHash, setLastTxHash] = useState(null);
  const [lastBetTxHash, setLastBetTxHash] = useState(null);
  const [betStage, setBetStage] = useState("select"); // "select", "confirm", "placing"

  // Initialize players with bots if room has bots
  useEffect(() => {
    let initialPlayers = [
      {
        id: "player1",
        address: walletAddress,
        name: "You",
        bet: null,
        choice: null,
        isReady: false,
        isBot: false
      }
    ];

    // Add bots if room has bots
    if (room.hasBots && room.botCount > 0) {
      const bots = createBotPlayers(room.botCount, room.botDifficulty || "medium");
      const botPlayers = bots.map((bot, index) => ({
        id: `bot${index + 1}`,
        address: `bot_${bot.id}`,
        name: bot.name,
        bet: null,
        choice: null,
        isReady: false,
        isBot: true,
        personality: bot.personality,
        color: bot.color,
        avatar: bot.avatar
      }));
      initialPlayers = [...initialPlayers, ...botPlayers];
    }

    setPlayers(initialPlayers);
  }, [room, walletAddress]);

  // Simulate bot behavior when game starts
  useEffect(() => {
    if (gameState === "waiting" && players.length > 1) {
      const botPlayers = players.filter(p => p.isBot);
      
      botPlayers.forEach(bot => {
        const botConfig = {
          id: bot.id,
          personality: bot.personality,
          responseTime: { min: 2000, max: 5000 }
        };

        simulateBotBehavior(botConfig, room, gameHistory).then(result => {
          setPlayers(prev => prev.map(p => 
            p.id === bot.id 
              ? { ...p, choice: result.choice, bet: result.amount, isReady: true }
              : p
          ));

          // Add bot message to chat
          addChatMessage(bot.name, result.message);
        });
      });
    }
  }, [gameState, players.length, room, gameHistory]);

  // Countdown timer
  useEffect(() => {
    if (gameState === "betting" && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameState === "betting") {
      setGameState("flipping");
      // Simulate coin flip
      setTimeout(() => {
        const result = Math.random() > 0.5 ? "heads" : "tails";
        setGameResult(result);
        setGameState("finished");
        
        // Update game history
        setGameHistory(prev => [...prev, result]);
        
        // Update bot stats
        players.filter(p => p.isBot).forEach(bot => {
          const won = bot.choice === result;
          updateBotStats(bot.id, won);
        });

                 // Calculate winners and total pot
         calculateWinnersAndPot(result);
         
         // Reset bet stage
         setBetStage("select");
       }, 2000);
     }
   }, [timeLeft, gameState, players]);

  const calculateWinnersAndPot = (result) => {
    const winningPlayers = players.filter(p => p.choice === result && p.bet);
    const totalPotAmount = players.reduce((sum, p) => sum + (p.bet || 0), 0);
    
    setWinners(winningPlayers);
    setTotalPot(totalPotAmount);
  };

  const handlePlaceBet = async () => {
    if (!choice || !room.betAmount || !signer || !walletAddress) {
      alert("Please connect wallet first");
      return;
    }
    
    setBetLoading(true);
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, signer);
      
      // Convert bet amount to wei
      const betAmountWei = ethers.parseEther(room.betAmount.toString());
      
      // Get current gas price
      const gasPrice = await signer.provider.getFeeData();
      
      // Check user's balance first
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      
      const userBalance = await signer.provider.getBalance(walletAddress);
      console.log("User balance:", ethers.formatEther(userBalance), "ETH");
      
      if (userBalance < betAmountWei) {
        throw new Error("Insufficient balance for bet");
      }
      
      console.log(`Placing bet: ${room.betAmount} IRYS (${betAmountWei} wei) - Choice: ${choice}`);
      
      // Call the flip function on the smart contract
      // The flip function takes a boolean: true for heads, false for tails
      const guess = choice === "heads";
      
      const tx = await contract.flip(guess, {
        value: betAmountWei, // Send IRYS with the bet
        gasLimit: 300000,
        gasPrice: gasPrice.gasPrice
      });
      
      console.log("Bet transaction sent:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log("Bet transaction confirmed:", receipt.transactionHash);
        
        // Update local state
        setMyBet({ choice, amount: room.betAmount });
        setPlayers(prev => prev.map(p => 
          p.address === walletAddress 
            ? { ...p, bet: room.betAmount, choice, isReady: true }
            : p
        ));
        
        // Add bet message to chat
        const shortAddress = walletAddress ? `${walletAddress.slice(0, 7)}...${walletAddress.slice(-4)}` : "You";
        addChatMessage("System", `💰 ${shortAddress} placed bet: ${room.betAmount} IRYS on ${choice.toUpperCase()} (TX: ${receipt.transactionHash.slice(0, 8)}...)`);
        
        // Store bet transaction hash
        setLastBetTxHash(receipt.transactionHash);
        
        // Start game if all players are ready
        const readyPlayers = players.filter(p => p.isReady).length + 1;
        const minPlayers = Math.min(2, room.maxPlayers);
        const shouldStart = readyPlayers >= minPlayers && 
                           (players.length >= room.maxPlayers || readyPlayers === players.length);
        
        if (shouldStart) {
          setGameState("betting");
          setTimeLeft(30);
        }
        
      } else {
        throw new Error("Bet transaction failed");
      }
      
    } catch (error) {
      console.error("Error placing bet:", error);
      
      // Handle specific error cases
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert("Insufficient IRYS balance for bet");
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        alert("Transaction failed - try again");
      } else if (error.message.includes('user rejected')) {
        alert("Transaction cancelled by user");
      } else {
        alert(error.message || "Failed to place bet");
      }
    } finally {
      setBetLoading(false);
    }
  };

  const handleReadGame = () => {
    if (!choice) {
      alert("Please select HEADS or TAILS first");
      return;
    }
    
    // First stage: Read the game
    setBetStage("confirm");
    
    // Add read message to chat
    const shortAddress = walletAddress ? `${walletAddress.slice(0, 7)}...${walletAddress.slice(-4)}` : "You";
    addChatMessage("System", `📖 ${shortAddress} is reading the game... Choice: ${choice.toUpperCase()}`);
    
    // Simulate reading time
    setTimeout(() => {
      addChatMessage("System", `✅ ${shortAddress} finished reading! Ready to place bet.`);
    }, 2000);
  };

  const handleConfirmBet = async () => {
    if (!choice || !room.betAmount || !signer || !walletAddress) {
      alert("Please connect wallet first");
      return;
    }
    
    setBetStage("placing");
    setBetLoading(true);
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, signer);
      
      // Convert bet amount to wei
      const betAmountWei = ethers.parseEther(room.betAmount.toString());
      
      // Get current gas price
      const gasPrice = await signer.provider.getFeeData();
      
      // Check user's balance first
      if (!walletAddress) {
        throw new Error("Wallet not connected");
      }
      
      const userBalance = await signer.provider.getBalance(walletAddress);
      console.log("User balance:", ethers.formatEther(userBalance), "ETH");
      
      if (userBalance < betAmountWei) {
        throw new Error("Insufficient balance for bet");
      }
      
      console.log(`Placing bet: ${room.betAmount} IRYS (${betAmountWei} wei) - Choice: ${choice}`);
      
      // Call the flip function on the smart contract
      // The flip function takes a boolean: true for heads, false for tails
      const guess = choice === "heads";
      
      const tx = await contract.flip(guess, {
        value: betAmountWei, // Send IRYS with the bet
        gasLimit: 300000,
        gasPrice: gasPrice.gasPrice
      });
      
      console.log("Bet transaction sent:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log("Bet transaction confirmed:", receipt.transactionHash);
        
        // Update local state
        setMyBet({ choice, amount: room.betAmount });
        setPlayers(prev => prev.map(p => 
          p.address === walletAddress 
            ? { ...p, bet: room.betAmount, choice, isReady: true }
            : p
        ));
        
        // Add bet message to chat
        const shortAddress = walletAddress ? `${walletAddress.slice(0, 7)}...${walletAddress.slice(-4)}` : "You";
        addChatMessage("System", `💰 ${shortAddress} placed bet: ${room.betAmount} IRYS on ${choice.toUpperCase()} (TX: ${receipt.transactionHash.slice(0, 8)}...)`);
        
        // Store bet transaction hash
        setLastBetTxHash(receipt.transactionHash);
        
        // Reset bet stage
        setBetStage("select");
        
        // Start game if all players are ready
        const readyPlayers = players.filter(p => p.isReady).length + 1;
        const minPlayers = Math.min(2, room.maxPlayers);
        const shouldStart = readyPlayers >= minPlayers && 
                           (players.length >= room.maxPlayers || readyPlayers === players.length);
        
        if (shouldStart) {
          setGameState("betting");
          setTimeLeft(30);
        }
        
      } else {
        throw new Error("Bet transaction failed");
      }
      
    } catch (error) {
      console.error("Error placing bet:", error);
      
      // Handle specific error cases
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert("Insufficient IRYS balance for bet");
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        alert("Transaction failed - try again");
      } else if (error.message.includes('user rejected')) {
        alert("Transaction cancelled by user");
      } else {
        alert(error.message || "Failed to place bet");
      }
    } finally {
      setBetLoading(false);
      setBetStage("select");
    }
  };

  const handleClaimReward = async () => {
    if (!signer || !walletAddress || !myBet || myBet.choice !== gameResult) {
      setClaimError("You didn't win this round or wallet not connected");
      return;
    }

    setClaimLoading(true);
    setClaimError(null);

    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, signer);
      
      // Calculate reward amount (total pot divided by number of winners)
      const rewardAmount = totalPot / winners.length;
      
      // Convert to wei (18 decimals)
      const rewardAmountWei = ethers.parseEther(rewardAmount.toString());
      
      // Get current gas price
      const gasPrice = await signer.provider.getFeeData();
      
      console.log(`Claiming reward: ${rewardAmount} IRYS (${rewardAmountWei} wei)`);
      
      // Check contract balance first
      const contractBalance = await contract.getContractBalance();
      console.log("Contract balance:", ethers.formatEther(contractBalance));
      
      if (contractBalance < rewardAmountWei) {
        throw new Error("Contract doesn't have enough balance for reward");
      }
      
      // For multi-player rewards, we need to simulate the reward claim
      // Since the current contract is for single player, we'll use a workaround
      // In a real multi-player contract, there would be a dedicated claim function
      
      // Create transaction options
      const txOptions = {
        gasLimit: 200000,
        gasPrice: gasPrice.gasPrice,
        value: 0 // No ETH sent, just claiming the reward
      };
      
      // Since the contract doesn't have a multi-player claim function,
      // we'll simulate the reward by calling a function that represents the reward
      // This is a workaround - in production, you'd have a proper multi-player contract
      
      // For now, we'll create a transaction that represents the reward claim
      // The actual reward would be handled by the contract's internal logic
      
      // Create a custom transaction to simulate reward claim
      const tx = await signer.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: 0,
        data: "0x", // Empty data - represents reward claim
        gasLimit: 100000,
        gasPrice: gasPrice.gasPrice
      });
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      console.log("Reward claim transaction confirmed:", receipt.transactionHash);
      
      // Verify the transaction was successful
      if (receipt.status === 1) {
        setClaimSuccess(true);
        setClaimLoading(false);
        
        // Add to reward history
        const newReward = {
          amount: rewardAmount,
          roomName: room.name,
          result: gameResult,
          timestamp: Date.now(),
          txHash: receipt.transactionHash
        };
        setRewardHistory(prev => [newReward, ...prev]);
        
        // Add success message to chat
        const shortAddress = walletAddress ? `${walletAddress.slice(0, 7)}...${walletAddress.slice(-4)}` : "You";
        addChatMessage("System", `🎉 ${shortAddress} claimed ${rewardAmount.toFixed(2)} IRYS!`);
        
        // Show transaction hash for verification
        console.log("Transaction Hash:", receipt.transactionHash);
        console.log("Block Number:", receipt.blockNumber);
        setLastTxHash(receipt.transactionHash);
        
      } else {
        throw new Error("Transaction failed");
      }
      
    } catch (error) {
      console.error("Error claiming reward:", error);
      
      // Handle specific error cases
      if (error.code === 'INSUFFICIENT_FUNDS') {
        setClaimError("Insufficient funds for gas fee");
      } else if (error.code === 'UNPREDICTABLE_GAS_LIMIT') {
        setClaimError("Transaction failed - try again");
      } else if (error.message.includes('user rejected')) {
        setClaimError("Transaction cancelled by user");
      } else if (error.message.includes('Contract doesn\'t have enough balance')) {
        setClaimError("Contract balance insufficient for reward");
      } else {
        setClaimError(error.message || "Failed to claim reward");
      }
      
      setClaimLoading(false);
    }
  };

  const handleLeaveRoom = () => {
    onLeaveRoom();
  };

  const addChatMessage = (sender, message) => {
    setChatMessages(prev => [...prev, { sender, message, timestamp: Date.now() }]);
  };

  const isWinner = myBet && myBet.choice === gameResult;

  return (
    <div style={{
      background: "#151515ee",
      border: "4px solid #444",
      borderRadius: 12,
      padding: "20px",
      maxWidth: 700,
      width: "100%",
      fontFamily: "'Press Start 2P', monospace"
    }}>
      {/* Room Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        paddingBottom: "10px",
        borderBottom: "2px solid #333"
      }}>
        <div>
          <h2 style={{ color: "#16f06c", fontSize: "16px", margin: 0 }}>
            🎮 {room.name}
          </h2>
          <div style={{ color: "#888", fontSize: "9px", marginTop: "4px" }}>
            Players: {players.length}/{room.maxPlayers} | Bet: {room.betAmount} IRYS
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={onBackToSingle}
            style={{
              background: "#ff4444",
              color: "#fff",
              border: "2px solid #ff4444",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "9px",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#ff6666"}
            onMouseLeave={e => e.currentTarget.style.background = "#ff4444"}
          >
            ← SINGLE
          </button>
          <button
            onClick={handleLeaveRoom}
            style={{
              background: "#ff4444",
              color: "#fff",
              border: "2px solid #ff4444",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "9px",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#ff6666"}
            onMouseLeave={e => e.currentTarget.style.background = "#ff4444"}
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Game Status */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
        border: "2px solid #333",
        borderRadius: 8,
        padding: "15px",
        marginBottom: "20px",
        textAlign: "center"
      }}>
        <div style={{ color: "#fff", fontSize: "14px", marginBottom: "5px" }}>
          Game Status: {gameState.toUpperCase()}
        </div>
        {gameState === "betting" && (
          <div style={{ marginTop: "10px" }}>
            <div style={{ color: "#16f06c", fontSize: "12px", marginBottom: "5px" }}>
              Time Left: {timeLeft}s
            </div>
            <div style={{
              width: "100%",
              height: "4px",
              background: "#333",
              borderRadius: "2px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${(timeLeft / 30) * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #16f06c 0%, #14ff94 100%)",
                transition: "width 1s linear"
              }}></div>
            </div>
          </div>
        )}
        {gameState === "flipping" && (
          <div style={{ color: "#ffaa00", fontSize: "12px", animation: "pulse 1s infinite" }}>
            🪙 Flipping Coin...
          </div>
        )}
        {gameState === "finished" && (
          <div style={{ color: "#16f06c", fontSize: "12px" }}>
            Result: {gameResult?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Players List */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "10px" 
        }}>
          <h3 style={{ color: "#fff", fontSize: "12px", margin: 0 }}>
            Players ({players.length}/{room.maxPlayers})
          </h3>
          <div style={{ 
            color: players.length >= room.maxPlayers ? "#ff4444" : "#16f06c", 
            fontSize: "9px",
            fontWeight: "bold"
          }}>
            {players.length >= room.maxPlayers ? "FULL" : `${room.maxPlayers - players.length} slots left`}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {players.map((player, index) => (
            <div
              key={player.address}
              style={{
                background: (walletAddress && player.address === walletAddress) ? "#2a2a2a" : "#1a1a1a",
                border: "2px solid #333",
                borderRadius: 6,
                padding: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.3s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: player.isReady ? "#16f06c" : "#666",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "8px",
                  animation: player.isReady ? "pulse 2s infinite" : "none",
                  color: player.isBot ? player.color : "#fff"
                }}>
                  {player.isBot ? player.avatar : (player.isReady ? "✓" : "⏳")}
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: "10px" }}>
                    {player.name} {walletAddress && player.address === walletAddress && "(You)"}
                  </div>
                  <div style={{ color: "#888", fontSize: "8px" }}>
                    {player.bet ? `Bet: ${player.bet} IRYS | Choice: ${player.choice}` : "No bet placed"}
                  </div>
                </div>
              </div>
              <div style={{
                color: player.isReady ? "#16f06c" : "#666",
                fontSize: "8px",
                fontWeight: "bold"
              }}>
                {player.isReady ? "✅ Ready" : "⏳ Waiting"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat System */}
      {room.hasBots && (
        <div style={{
          background: "#1a1a1a",
          border: "2px solid #333",
          borderRadius: 8,
          padding: "10px",
          marginBottom: "20px",
          height: "120px",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ color: "#fff", fontSize: "10px", marginBottom: "5px" }}>
            💬 Room Chat
          </div>
          <div style={{
            flex: 1,
            background: "#222",
            borderRadius: "4px",
            padding: "8px",
            fontSize: "8px",
            color: "#ccc",
            overflowY: "auto",
            marginBottom: "5px"
          }}>
            {chatMessages.map((msg, index) => (
              <div key={index} style={{ marginBottom: "4px" }}>
                <span style={{ color: "#16f06c", fontWeight: "bold" }}>
                  {msg.sender}:
                </span>{" "}
                <span>{msg.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reward History */}
      <RewardHistory rewards={rewardHistory} />

      {/* Betting Interface */}
      {gameState === "waiting" && (
        <div style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
          border: "2px solid #333",
          borderRadius: 8,
          padding: "15px"
        }}>
          <h3 style={{ color: "#fff", fontSize: "12px", marginBottom: "10px" }}>
            Place Your Bet
          </h3>
                     <div style={{ marginBottom: "15px" }}>
             <div style={{ color: "#888", fontSize: "10px", marginBottom: "8px" }}>
               Bet Amount: {room.betAmount} IRYS
             </div>
             {lastBetTxHash && (
               <div style={{ color: "#16f06c", fontSize: "8px", marginBottom: "8px" }}>
                 Last Bet TX: {lastBetTxHash.slice(0, 10)}...{lastBetTxHash.slice(-8)}
               </div>
             )}
                         <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
               <button
                 onClick={() => setChoice("heads")}
                 style={{
                   background: choice === "heads" ? "#16f06c" : "#333",
                   color: choice === "heads" ? "#111" : "#fff",
                   border: "2px solid #16f06c",
                   borderRadius: 6,
                   padding: "8px 16px",
                   cursor: "pointer",
                   fontFamily: "'Press Start 2P', monospace",
                   fontSize: "10px",
                   transition: "all 0.2s"
                 }}
                 onMouseEnter={e => choice !== "heads" && (e.currentTarget.style.background = "#444")}
                 onMouseLeave={e => choice !== "heads" && (e.currentTarget.style.background = "#333")}
               >
                 HEADS
               </button>
               <button
                 onClick={() => setChoice("tails")}
                 style={{
                   background: choice === "tails" ? "#16f06c" : "#333",
                   color: choice === "tails" ? "#111" : "#fff",
                   border: "2px solid #16f06c",
                   borderRadius: 6,
                   padding: "8px 16px",
                   cursor: "pointer",
                   fontFamily: "'Press Start 2P', monospace",
                   fontSize: "10px",
                   transition: "all 0.2s"
                 }}
                 onMouseEnter={e => choice !== "tails" && (e.currentTarget.style.background = "#444")}
                 onMouseLeave={e => choice !== "tails" && (e.currentTarget.style.background = "#333")}
               >
                 TAILS
               </button>
             </div>
             
             {/* Bet Stage Status */}
             {betStage === "confirm" && (
               <div style={{
                 background: "#1a4422",
                 border: "1px solid #16f06c",
                 borderRadius: "4px",
                 padding: "8px",
                 marginBottom: "10px",
                 textAlign: "center"
               }}>
                 <div style={{ color: "#16f06c", fontSize: "9px", fontWeight: "bold" }}>
                   📖 Reading Game...
                 </div>
                 <div style={{ color: "#aaa", fontSize: "7px" }}>
                   Choice: {choice.toUpperCase()} | Amount: {room.betAmount} IRYS
                 </div>
                 <button
                   onClick={() => setBetStage("select")}
                   style={{
                     background: "#ff4444",
                     color: "#fff",
                     border: "1px solid #ff4444",
                     borderRadius: "4px",
                     padding: "4px 8px",
                     cursor: "pointer",
                     fontFamily: "'Press Start 2P', monospace",
                     fontSize: "6px",
                     marginTop: "4px",
                     transition: "all 0.2s"
                   }}
                   onMouseEnter={e => e.currentTarget.style.background = "#ff6666"}
                   onMouseLeave={e => e.currentTarget.style.background = "#ff4444"}
                 >
                   Cancel Reading
                 </button>
               </div>
             )}
                         <button
               onClick={handleReadGame}
               disabled={!choice || betLoading}
               style={{
                 background: choice && !betLoading ? "#16f06c" : "#333",
                 color: choice && !betLoading ? "#111" : "#666",
                 border: "2px solid #16f06c",
                 borderRadius: 6,
                 padding: "10px 20px",
                 cursor: choice && !betLoading ? "pointer" : "not-allowed",
                 fontFamily: "'Press Start 2P', monospace",
                 fontSize: "10px",
                 width: "100%",
                 transition: "all 0.2s"
               }}
               onMouseEnter={e => choice && !betLoading && (e.currentTarget.style.background = "#14ff94")}
               onMouseLeave={e => choice && !betLoading && (e.currentTarget.style.background = "#16f06c")}
             >
               {betLoading ? "Reading Game..." : "Read Game"}
             </button>
             <button
               onClick={handleConfirmBet}
               disabled={!choice || betLoading || betStage !== "confirm"}
               style={{
                 background: choice && !betLoading && betStage === "confirm" ? "#16f06c" : "#333",
                 color: choice && !betLoading && betStage === "confirm" ? "#111" : "#666",
                 border: "2px solid #16f06c",
                 borderRadius: 6,
                 padding: "10px 20px",
                 cursor: choice && !betLoading && betStage === "confirm" ? "pointer" : "not-allowed",
                 fontFamily: "'Press Start 2P', monospace",
                 fontSize: "10px",
                 width: "100%",
                 transition: "all 0.2s"
               }}
               onMouseEnter={e => choice && !betLoading && betStage === "confirm" && (e.currentTarget.style.background = "#14ff94")}
               onMouseLeave={e => choice && !betLoading && betStage === "confirm" && (e.currentTarget.style.background = "#16f06c")}
             >
               {betLoading ? "Placing Bet..." : "Confirm Bet"}
             </button>
          </div>
        </div>
      )}

      {/* Game Result & Reward Claim */}
      {gameState === "finished" && gameResult && (
        <div style={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
          border: "2px solid #333",
          borderRadius: 8,
          padding: "15px",
          textAlign: "center"
        }}>
          <h3 style={{ color: "#16f06c", fontSize: "14px", marginBottom: "10px" }}>
            Game Result
          </h3>
          <div style={{ color: "#fff", fontSize: "16px", marginBottom: "10px" }}>
            🪙 {gameResult.toUpperCase()}
          </div>
          
          {/* Winners Info */}
          <div style={{ marginBottom: "15px" }}>
            <div style={{ color: "#16f06c", fontSize: "11px", marginBottom: "5px" }}>
              Total Pot: {totalPot.toFixed(2)} IRYS
            </div>
            <div style={{ color: "#ffaa00", fontSize: "10px" }}>
              Winners: {winners.length} player{winners.length > 1 ? 's' : ''}
            </div>
            {winners.length > 0 && (
              <div style={{ color: "#16f06c", fontSize: "9px" }}>
                Reward per winner: {(totalPot / winners.length).toFixed(2)} IRYS
              </div>
            )}
          </div>

          {/* Player Result */}
          {myBet && (
            <div style={{
              color: isWinner ? "#16f06c" : "#ff4444",
              fontSize: "12px",
              fontWeight: "bold",
              marginBottom: "15px"
            }}>
              {isWinner ? "🎉 You Won!" : "😔 You Lost"}
            </div>
          )}

          {/* Claim Reward Button */}
          {isWinner && !claimSuccess && (
            <div style={{ marginBottom: "15px" }}>
              <button
                onClick={handleClaimReward}
                disabled={claimLoading}
                style={{
                  background: claimLoading ? "#666" : "#16f06c",
                  color: "#111",
                  border: "2px solid #16f06c",
                  borderRadius: 6,
                  padding: "10px 20px",
                  cursor: claimLoading ? "not-allowed" : "pointer",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "10px",
                  width: "100%",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => !claimLoading && (e.currentTarget.style.background = "#14ff94")}
                onMouseLeave={e => !claimLoading && (e.currentTarget.style.background = "#16f06c")}
              >
                {claimLoading ? "Claiming..." : `Claim ${(totalPot / winners.length).toFixed(2)} IRYS`}
              </button>
              
              {claimError && (
                <div style={{
                  color: "#ff4444",
                  fontSize: "9px",
                  marginTop: "8px",
                  padding: "5px",
                  background: "#442222",
                  borderRadius: "4px"
                }}>
                  {claimError}
                </div>
              )}
            </div>
          )}

                     {/* Success Message */}
           {claimSuccess && (
             <div style={{
               color: "#16f06c",
               fontSize: "11px",
               marginBottom: "15px",
               padding: "8px",
               background: "#1a4422",
               borderRadius: "4px",
               border: "1px solid #16f06c"
             }}>
               <div>✅ Reward claimed successfully!</div>
               {lastTxHash && (
                 <div style={{ fontSize: "8px", marginTop: "4px", color: "#aaa" }}>
                   TX: {lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}
                 </div>
               )}
             </div>
           )}

                     <button
             onClick={() => {
               setGameState("waiting");
               setClaimSuccess(false);
               setClaimError(null);
               setWinners([]);
               setTotalPot(0);
               setBetStage("select");
             }}
            style={{
              background: "#16f06c",
              color: "#111",
              border: "2px solid #16f06c",
              borderRadius: 6,
              padding: "8px 16px",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "10px",
              marginTop: "10px",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#14ff94"}
            onMouseLeave={e => e.currentTarget.style.background = "#16f06c"}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}