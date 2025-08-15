import React from "react";

export default function RewardHistory({ rewards }) {
  if (!rewards || rewards.length === 0) {
    return (
      <div style={{
        background: "#1a1a1a",
        border: "2px solid #333",
        borderRadius: 8,
        padding: "15px",
        marginBottom: "20px"
      }}>
        <h3 style={{ color: "#fff", fontSize: "12px", marginBottom: "10px" }}>
          🏆 Reward History
        </h3>
        <div style={{ color: "#888", fontSize: "10px", textAlign: "center" }}>
          No rewards claimed yet
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "#1a1a1a",
      border: "2px solid #333",
      borderRadius: 8,
      padding: "15px",
      marginBottom: "20px"
    }}>
      <h3 style={{ color: "#fff", fontSize: "12px", marginBottom: "10px" }}>
        🏆 Reward History
      </h3>
      <div style={{ maxHeight: "150px", overflowY: "auto" }}>
        {rewards.map((reward, index) => (
          <div
            key={index}
            style={{
              background: "#222",
              border: "1px solid #444",
              borderRadius: 6,
              padding: "8px",
              marginBottom: "6px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ color: "#16f06c", fontSize: "9px", fontWeight: "bold" }}>
                +{reward.amount.toFixed(2)} IRYS
              </div>
                             <div style={{ color: "#888", fontSize: "7px" }}>
                 {reward.roomName} | {reward.result}
                 {reward.txHash && (
                   <div style={{ color: "#666", fontSize: "6px", marginTop: "2px" }}>
                     TX: {reward.txHash.slice(0, 8)}...{reward.txHash.slice(-6)}
                   </div>
                 )}
               </div>
            </div>
            <div style={{ color: "#666", fontSize: "7px" }}>
              {new Date(reward.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      <div style={{
        color: "#16f06c",
        fontSize: "9px",
        textAlign: "center",
        marginTop: "8px",
        padding: "4px",
        background: "#1a4422",
        borderRadius: "4px"
      }}>
        Total Earned: {rewards.reduce((sum, r) => sum + r.amount, 0).toFixed(2)} IRYS
      </div>
    </div>
  );
} 