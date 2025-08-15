import React, { useState, useEffect } from "react";
import { createBotPlayers } from "../utils/botSystem";

export default function MultiPlayerLobby({ onJoinRoom, onCreateRoom, walletAddress, onBackToSingle }) {
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomName, setRoomName] = useState("");
  const [betAmount, setBetAmount] = useState(0.1);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, waiting, playing
  const [botCount, setBotCount] = useState(2);
  const [botDifficulty, setBotDifficulty] = useState("medium");
  const [enableBots, setEnableBots] = useState(true);

  // Mock rooms data - in real implementation this would come from backend
  useEffect(() => {
    const mockRooms = [
      {
        id: "room1",
        name: "High Rollers Room",
        players: 3,
        maxPlayers: 4,
        betAmount: 0.5,
        status: "waiting",
        createdBy: "0x1234...5678",
        hasBots: true,
        botCount: 2
      },
      {
        id: "room2", 
        name: "Beginner Room",
        players: 1,
        maxPlayers: 6,
        betAmount: 0.05,
        status: "waiting",
        createdBy: "0x8765...4321",
        hasBots: false
      },
      {
        id: "room3",
        name: "VIP Room",
        players: 2,
        maxPlayers: 2,
        betAmount: 1.0,
        status: "playing",
        createdBy: "0x9999...8888",
        hasBots: true,
        botCount: 1
      },
      {
        id: "room4",
        name: "Pro Room",
        players: 4,
        maxPlayers: 4,
        betAmount: 2.0,
        status: "waiting",
        createdBy: "0x1111...2222",
        hasBots: true,
        botCount: 3
      }
    ];
    setRooms(mockRooms);
  }, []);

  const handleCreateRoom = () => {
    if (!roomName.trim() || betAmount <= 0) {
      alert("Please enter room name and valid bet amount");
      return;
    }
    
    // Validate bot count vs max players
    if (enableBots && botCount >= maxPlayers) {
      alert("Bot count cannot be greater than or equal to max players");
      return;
    }
    
    const newRoom = {
      id: `room_${Date.now()}`,
      name: roomName,
      players: 1,
      maxPlayers: maxPlayers,
      betAmount: betAmount,
      status: "waiting",
      createdBy: walletAddress,
      hasBots: enableBots,
      botCount: enableBots ? botCount : 0,
      botDifficulty: enableBots ? botDifficulty : "medium"
    };
    
    onCreateRoom(newRoom);
  };

  const handleJoinRoom = (room) => {
    if (room.players >= room.maxPlayers) {
      alert("Room is full!");
      return;
    }
    onJoinRoom(room);
  };

  const filteredRooms = rooms.filter(room => {
    if (filter === "all") return true;
    if (filter === "waiting") return room.status === "waiting";
    if (filter === "playing") return room.status === "playing";
    return true;
  });

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
      {/* Header with Back Button */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px"
      }}>
        <h2 style={{
          color: "#16f06c",
          fontSize: "18px",
          margin: 0
        }}>
          🎮 MULTI-PLAYER LOBBY
        </h2>
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
      </div>

      {/* Create Room Section */}
      <div style={{
        background: "linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)",
        border: "2px solid #333",
        borderRadius: 8,
        padding: "15px",
        marginBottom: "20px"
      }}>
        <h3 style={{ color: "#fff", fontSize: "14px", marginBottom: "10px" }}>
          🏠 Create New Room
        </h3>
        
        {/* Basic Room Settings */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              background: "#222",
              border: "2px solid #444",
              borderRadius: 4,
              color: "#fff",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "10px"
            }}
          />
          <input
            type="number"
            placeholder="Bet Amount"
            value={betAmount}
            onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
            style={{
              width: "120px",
              padding: "8px 12px",
              background: "#222",
              border: "2px solid #444",
              borderRadius: 4,
              color: "#fff",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "10px"
            }}
          />
        </div>

        {/* Player Settings */}
        <div style={{
          background: "#222",
          border: "1px solid #444",
          borderRadius: 6,
          padding: "10px",
          marginBottom: "10px"
        }}>
          <div style={{ color: "#16f06c", fontSize: "10px", marginBottom: "8px" }}>
            👥 Player Settings
          </div>
          
          <div style={{ display: "flex", gap: "10px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ color: "#888", fontSize: "8px", display: "block", marginBottom: "4px" }}>
                Max Players:
              </label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  padding: "4px 8px",
                  background: "#333",
                  border: "1px solid #555",
                  borderRadius: 4,
                  color: "#fff",
                  fontSize: "8px",
                  fontFamily: "'Press Start 2P', monospace"
                }}
              >
                <option value={2}>2 Players</option>
                <option value={3}>3 Players</option>
                <option value={4}>4 Players</option>
                <option value={6}>6 Players</option>
                <option value={8}>8 Players</option>
                <option value={10}>10 Players</option>
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ color: "#888", fontSize: "8px", display: "block", marginBottom: "4px" }}>
                Available Slots:
              </label>
              <div style={{
                color: "#16f06c",
                fontSize: "10px",
                fontWeight: "bold",
                padding: "4px 8px",
                background: "#333",
                borderRadius: 4,
                textAlign: "center"
              }}>
                {maxPlayers - (enableBots ? botCount : 0)} slots
              </div>
            </div>
          </div>
        </div>

        {/* Bot Settings */}
        <div style={{
          background: "#222",
          border: "1px solid #444",
          borderRadius: 6,
          padding: "10px",
          marginBottom: "10px"
        }}>
          <div style={{ color: "#16f06c", fontSize: "10px", marginBottom: "8px" }}>
            🤖 Bot Settings
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <label style={{ color: "#fff", fontSize: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
              <input
                type="checkbox"
                checked={enableBots}
                onChange={(e) => setEnableBots(e.target.checked)}
                style={{ margin: 0 }}
              />
              Enable Bots
            </label>
          </div>

          {enableBots && (
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#888", fontSize: "8px", display: "block", marginBottom: "4px" }}>
                  Bot Count:
                </label>
                <select
                  value={botCount}
                  onChange={(e) => setBotCount(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "4px 8px",
                    background: "#333",
                    border: "1px solid #555",
                    borderRadius: 4,
                    color: "#fff",
                    fontSize: "8px",
                    fontFamily: "'Press Start 2P', monospace"
                  }}
                >
                  {[...Array(Math.min(maxPlayers - 1, 5))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1} Bot{i + 1 > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ color: "#888", fontSize: "8px", display: "block", marginBottom: "4px" }}>
                  Difficulty:
                </label>
                <select
                  value={botDifficulty}
                  onChange={(e) => setBotDifficulty(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "4px 8px",
                    background: "#333",
                    border: "1px solid #555",
                    borderRadius: 4,
                    color: "#fff",
                    fontSize: "8px",
                    fontFamily: "'Press Start 2P', monospace"
                  }}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={loading}
          style={{
            background: "#16f06c",
            color: "#111",
            border: "2px solid #16f06c",
            borderRadius: 6,
            padding: "8px 16px",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Press Start 2P', monospace",
            fontSize: "10px",
            opacity: loading ? 0.6 : 1,
            transition: "all 0.2s"
          }}
          onMouseEnter={e => !loading && (e.currentTarget.style.background = "#14ff94")}
          onMouseLeave={e => !loading && (e.currentTarget.style.background = "#16f06c")}
        >
          {loading ? "Creating..." : "Create Room"}
        </button>
      </div>

      {/* Room Filters */}
      <div style={{ marginBottom: "15px" }}>
        <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              background: filter === "all" ? "#16f06c" : "#333",
              color: filter === "all" ? "#111" : "#fff",
              padding: "4px 8px",
              fontSize: "8px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              transition: "all 0.2s"
            }}
          >
            ALL ROOMS
          </button>
          <button
            onClick={() => setFilter("waiting")}
            style={{
              background: filter === "waiting" ? "#16f06c" : "#333",
              color: filter === "waiting" ? "#111" : "#fff",
              padding: "4px 8px",
              fontSize: "8px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              transition: "all 0.2s"
            }}
          >
            WAITING
          </button>
          <button
            onClick={() => setFilter("playing")}
            style={{
              background: filter === "playing" ? "#16f06c" : "#333",
              color: filter === "playing" ? "#111" : "#fff",
              padding: "4px 8px",
              fontSize: "8px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "'Press Start 2P', monospace",
              transition: "all 0.2s"
            }}
          >
            PLAYING
          </button>
        </div>
      </div>

      {/* Available Rooms */}
      <div>
        <h3 style={{ color: "#fff", fontSize: "14px", marginBottom: "15px" }}>
          Available Rooms ({filteredRooms.length})
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filteredRooms.map((room) => {
            const isPremiumRoom = room.name.includes("VIP") || room.name.includes("Pro");
            return (
            <div
              key={room.id}
              className={room.status === "playing" ? "room-playing" : 
                       room.players >= room.maxPlayers ? "room-full" : "room-waiting"}
              style={{
                border: "2px solid #333",
                borderRadius: 8,
                padding: "15px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                opacity: isPremiumRoom ? 0.5 : 1,
                filter: isPremiumRoom ? "blur(0.5px)" : "none"
              }}
            >
              {/* Coming Soon label for premium rooms */}
              {isPremiumRoom && (
                <div style={{
                  position: "absolute",
                  top: "-8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#ffb04a",
                  color: "#111",
                  fontSize: "8px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  zIndex: 10,
                  fontWeight: "bold"
                }}>
                  COMING SOON
                </div>
              )}
              
              {/* Room status indicator */}
              <div style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 0,
                height: 0,
                borderLeft: "20px solid transparent",
                borderRight: "20px solid",
                borderBottom: "20px solid transparent",
                borderRightColor: room.status === "playing" ? "#ff4444" : 
                                 room.players >= room.maxPlayers ? "#666" : "#16f06c"
              }}></div>
              
              <div style={{ flex: 1 }}>
                <div style={{ color: "#fff", fontSize: "12px", marginBottom: "5px" }}>
                  {room.name}
                </div>
                <div style={{ color: "#888", fontSize: "9px" }}>
                  Bet: {room.betAmount} IRYS | Players: {room.players}/{room.maxPlayers} | Max: {room.maxPlayers}
                </div>
                <div style={{ 
                  color: room.status === "playing" ? "#ff6b6b" : "#16f06c", 
                  fontSize: "9px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  {room.status === "playing" ? "🔄 Playing" : "⏳ Waiting"}
                  {room.players >= room.maxPlayers && " | FULL"}
                  {room.hasBots && ` | 🤖 ${room.botCount} Bots`}
                </div>
              </div>
              <button
                onClick={() => !isPremiumRoom && handleJoinRoom(room)}
                disabled={room.players >= room.maxPlayers || room.status === "playing" || isPremiumRoom}
                style={{
                  background: room.players >= room.maxPlayers || room.status === "playing" || isPremiumRoom
                    ? "#333" : "#16f06c",
                  color: room.players >= room.maxPlayers || room.status === "playing" || isPremiumRoom
                    ? "#666" : "#111",
                  border: "2px solid #16f06c",
                  borderRadius: 6,
                  padding: "8px 12px",
                  cursor: room.players >= room.maxPlayers || room.status === "playing" || isPremiumRoom
                    ? "not-allowed" : "pointer",
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: "9px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={e => {
                  if (!room.players >= room.maxPlayers && room.status !== "playing" && !isPremiumRoom) {
                    e.currentTarget.style.background = "#14ff94";
                  }
                }}
                onMouseLeave={e => {
                  if (!room.players >= room.maxPlayers && room.status !== "playing" && !isPremiumRoom) {
                    e.currentTarget.style.background = "#16f06c";
                  }
                }}
              >
                {isPremiumRoom ? "Coming Soon" :
                 room.players >= room.maxPlayers ? "Full" : 
                 room.status === "playing" ? "Playing" : "Join"}
              </button>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
} 