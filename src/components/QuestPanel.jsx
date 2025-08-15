// QuestPanel.jsx (on-chain only, no local storage)
import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { COINFLIP_ABI, CONTRACT_ADDRESS } from "../utils/coinflipABI";
import {
  QUEST_TYPES,
  getPlayerQuestStatus,
  completeDailyLoginOnContract,
  claimQuestReward,
  canClaimQuestReward,
  getQuestRewardAmount,
  getQuestRequirements,
  getTotalAvailableRewards,
  clearAllLocalQuestData,
  initializeAutoQuestReset,
  cleanupAutoQuestReset
} from "../utils/questSystem";

export default function QuestPanel({ walletAddress }) {
  const [status, setStatus] = useState(null);
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
  const [reqs, setReqs] = useState({ dailyFlip: 10, weeklyFlips: 7, monthlyStreak: 30 });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [justCompletedLogin, setJustCompletedLogin] = useState(false);
  const [autoCompleted, setAutoCompleted] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const makeContractRO = async () => {
    if (!window?.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(CONTRACT_ADDRESS, COINFLIP_ABI, provider);
  };

  const refresh = async () => {
    if (!walletAddress || !window?.ethereum) return;
    setBusy(true);
    try {
      // 1) Get quest status from smart contract
      const s = await getPlayerQuestStatus(walletAddress);
      
      // Check if status seems inconsistent and force reset if needed
      if (s && s.dailyLoginCompleted) {
        const currentDate = new Date().toISOString().split('T')[0];
        const lastLoginDate = s.lastLoginDate ? new Date(Number(s.lastLoginDate) * 1000).toISOString().split('T')[0] : null;
        
        if (lastLoginDate !== currentDate) {
          console.log('🔄 Inconsistent daily login status detected - forcing reset');
          // Force clear local data and refresh
          clearAllLocalQuestData();
          // Try to get fresh status
          const freshStatus = await getPlayerQuestStatus(walletAddress);
          setStatus(freshStatus);
        } else {
          setStatus(s);
        }
      } else {
        setStatus(s);
      }
      
      // If daily login is completed, ensure claimable status is also set
      if (s && s.dailyLoginCompleted) {
        console.log('🔄 Daily login is completed - ensuring claimable status is correct');
        
        // Check if this was auto-completed
        const lastAutoCompleteKey = `lastAutoComplete_${walletAddress}`;
        const lastAutoComplete = localStorage.getItem(lastAutoCompleteKey);
        const currentDate = new Date().toISOString().split('T')[0];
        
        if (lastAutoComplete === currentDate) {
          setAutoCompleted(true);
          setTimeout(() => setAutoCompleted(false), 5000);
        }
      }
      
      // Log status for debugging
      console.log('🔄 Quest status refreshed:', s);
      console.log('🔄 Daily login completed:', s?.dailyLoginCompleted);
      console.log('🔄 Can claim daily login:', can?.[QUEST_TYPES.DAILY_LOGIN]);

      // 2) Get contract instance for canClaim + amount + requirements
      const contract = await makeContractRO();
      if (!contract) return;

      const types = [
        QUEST_TYPES.DAILY_LOGIN,
        QUEST_TYPES.DAILY_FLIP,
        QUEST_TYPES.WEEKLY_FLIPS,
        QUEST_TYPES.MONTHLY_STREAK,
      ];

      const can = {};
      const amts = {};
      for (const t of types) {
        can[t] = await canClaimQuestReward(contract, walletAddress, t);
        const raw = await getQuestRewardAmount(contract, walletAddress, t); // BigInt
        amts[t] = ethers.formatEther(raw ?? 0n);
      }

      // Get requirements from smart contract
      const requirements = await getQuestRequirements();
      setReqs(requirements);

      setClaimable(can);
      setAmounts(amts);
      setLastRefresh(new Date().toLocaleTimeString());
      
      // Ensure daily login claimable status is correct
      if (s && s.dailyLoginCompleted && !can[QUEST_TYPES.DAILY_LOGIN]) {
        console.log('🔄 Daily login completed but not claimable - forcing update');
        setClaimable(prev => ({
          ...prev,
          [QUEST_TYPES.DAILY_LOGIN]: true
        }));
      }
    } catch (e) {
      console.error("refresh error:", e);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    // Force clear local data first
    if (walletAddress) {
      clearAllLocalQuestData();
    }
    
    // Check if we need to reset quest status
    const checkAndReset = async () => {
      const currentDate = new Date().toISOString().split('T')[0];
      const lastResetKey = `lastQuestReset_${walletAddress}`;
      const lastReset = localStorage.getItem(lastResetKey);
      
      if (lastReset !== currentDate) {
        console.log('🔄 New day detected - resetting quest status');
        clearAllLocalQuestData();
        localStorage.setItem(lastResetKey, currentDate);
      }
    };
    
    checkAndReset();
    
    // Single refresh to load initial data
    refresh();
    
    // Initialize automatic quest reset system
    if (walletAddress) {
      initializeAutoQuestReset(walletAddress);
    }
    
          // Set up periodic refresh every 30 seconds to ensure data is current
    const refreshInterval = setInterval(() => {
      if (walletAddress) {
        refresh();
      }
    }, 30000);
    
    // Cleanup on unmount
    return () => {
      cleanupAutoQuestReset();
      clearInterval(refreshInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  const totalAvailable = useMemo(() => {
    if (!claimable) return "0.00";
    let sum = 0;
    for (const [k, v] of Object.entries(claimable)) {
      if (v) sum += parseFloat(amounts[k] || "0");
    }
    return (Math.round(sum * 100) / 100).toFixed(2);
  }, [claimable, amounts]);

  const handleCompleteDailyLogin = async () => {
    if (!walletAddress) return alert("Please connect your wallet first!");
    setBusy(true);
    try {
      // First, check current status from smart contract
      const currentStatus = await getPlayerQuestStatus(walletAddress);
      console.log('Current daily login status:', currentStatus?.dailyLoginCompleted);
      
      // If already completed, just refresh and show success
      if (currentStatus?.dailyLoginCompleted) {
        console.log('Daily login already completed - refreshing status');
        await refresh();
        setJustCompletedLogin(true);
        setTimeout(() => setJustCompletedLogin(false), 2500);
        return;
      }
      
      // If not completed, try to complete it
      const res = await completeDailyLoginOnContract();
      if (!res?.success) throw new Error(res?.message || "Failed");
      
      // Immediately update status to show completed
      if (status) {
        setStatus({
          ...status,
          dailyLoginCompleted: true
        });
      }
      
      // Update claimable status for daily login
      setClaimable(prev => ({
        ...prev,
        [QUEST_TYPES.DAILY_LOGIN]: true
      }));
      
      // Single refresh to ensure status is updated
      await refresh();
      
      setJustCompletedLogin(true); // Show "QUEST COMPLETED!"
      setTimeout(() => setJustCompletedLogin(false), 2500);
    } catch (e) {
      console.error('Error in handleCompleteDailyLogin:', e);
      
      // If error is "already completed", treat it as success
      if (e.message && e.message.includes('Daily login already completed')) {
        console.log('Daily login already completed - treating as success');
        await refresh();
        setJustCompletedLogin(true);
        setTimeout(() => setJustCompletedLogin(false), 2500);
      } else {
        alert(e?.message || "Failed to complete daily login");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleClaimAll = async () => {
    if (totalAvailable === "0.00") return;
    if (!walletAddress) return alert("Please connect your wallet first!");
    setBusy(true);
    try {
      const toClaim = Object.entries(claimable)
        .filter(([, can]) => !!can)
        .map(([t]) => Number(t));

      let totalClaimed = 0;
      for (const t of toClaim) {
        const r = await claimQuestReward(t); // Send claim transaction per quest
        if (!r?.success) continue;
        totalClaimed += parseFloat(r.amount || "0");
      }

      await refresh();
      setToast(`Claimed +${(Math.round(totalClaimed * 100) / 100).toFixed(2)} IRYS`);
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      alert(e?.message || "Claim failed");
    } finally {
      setBusy(false);
    }
  };

  const handleClearLocalData = async () => {
    if (!walletAddress) return alert("Please connect your wallet first!");
    setBusy(true);
    try {
      const result = clearAllLocalQuestData();
      if (result.success) {
        setToast("Local data cleared! Using smart contract data only.");
        setTimeout(() => setToast(null), 2500);
        await refresh(); // Refresh to get latest smart contract data
      } else {
        throw new Error(result.message);
      }
    } catch (e) {
      alert(e?.message || "Failed to clear local data");
    } finally {
      setBusy(false);
    }
  };

  if (!status) {
    return (
      <div style={panel()}>
        <div style={hdr()}>🎯 QUESTS</div>
        <div style={subtle()}>Connect wallet to view quests.</div>
      </div>
    );
  }

  const chip = (ok, textOk = "COMPLETED", textNo = "IN PROGRESS") => (
    <span style={badge(ok)}>{ok ? textOk : textNo}</span>
  );
  const claimedChip = <span style={badge(true)}>CLAIMED</span>;

  return (
    <div style={panel()}>
      {/* Header + Available Rewards */}
      <div style={rowBetween()}>
        <div style={hdr()}>🎯 QUESTS (Smart Contract Only)</div>

        <div style={rewardBox(totalAvailable !== "0.00")}>
          <div style={{ fontSize: 10, color: "#aaa" }}>Available Rewards</div>
          <div style={{ fontSize: 12, color: "#16f06c", fontWeight: 700 }}>
            +{totalAvailable} IRYS
          </div>
          <button
            onClick={handleClaimAll}
            disabled={busy || totalAvailable === "0.00"}
            style={claimBtn(busy || totalAvailable === "0.00")}
          >
            {busy ? "PROCESSING..." : "CLAIM REWARD"}
          </button>
        </div>
      </div>

      {/* Status and Controls */}
      <div style={{ marginBottom: 12, textAlign: "center", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, color: "#888" }}>
          Last update: {lastRefresh || "Never"}
        </div>
        <button
          onClick={handleClearLocalData}
          disabled={busy}
          style={{
            fontSize: 9,
            background: "#333",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: 4,
            padding: "4px 8px",
            cursor: busy ? "not-allowed" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "CLEARING..." : "CLEAR LOCAL DATA"}
        </button>
      </div>

      {/* DAILY LOGIN */}
      <div style={card()}>
        <div style={rowBetween()}>
          <div style={row()}>
            <span style={{ fontSize: 16 }}>🌅</span>
            <span style={title()}>Daily Login</span>
          </div>
          <div style={amountTag(status.dailyLoginCompleted, claimable[QUEST_TYPES.DAILY_LOGIN])}>
            +{parseFloat(amounts[QUEST_TYPES.DAILY_LOGIN] || "0").toFixed(2)} IRYS
          </div>
        </div>

        <div style={rowBetween()}>
          <div style={{ fontSize: 10, color: "#888" }}>
            {status.dailyLoginCompleted ? "Completed today (Auto-detected)" : "Auto-checking daily login..."}
          </div>

          {!status.dailyLoginCompleted ? (
            <button onClick={handleCompleteDailyLogin} disabled={busy} style={completeBtn(busy)}>
              {busy ? "SENDING..." : "HIRYS"}
            </button>
          ) : (
            claimable[QUEST_TYPES.DAILY_LOGIN] ? (
              chip(true, "COMPLETED")
            ) : (
              claimedChip
            )
          )}
        </div>

        {justCompletedLogin && toastBox("🎉 DAILY LOGIN COMPLETED!")}
        {autoCompleted && toastBox("🤖 AUTO-COMPLETED DAILY LOGIN!")}
      </div>

      {/* DAILY FLIPS */}
      <div style={card()}>
        <div style={rowBetween()}>
          <div style={row()}>
            <span style={{ fontSize: 16 }}>🪙</span>
            <span style={title()}>Daily Flips</span>
          </div>
          <div style={amountTag(status.dailyFlipCompleted, claimable[QUEST_TYPES.DAILY_FLIP])}>
            +{parseFloat(amounts[QUEST_TYPES.DAILY_FLIP] || "0").toFixed(2)} IRYS
          </div>
        </div>

        <div style={rowBetween()}>
          <div style={{ fontSize: 10, color: "#888" }}>
            Progress: {status.dailyFlipsToday}/10 flips
          </div>
          {claimable[QUEST_TYPES.DAILY_FLIP]
            ? chip(true, "COMPLETED")
            : status.dailyFlipCompleted
            ? claimedChip
            : chip(false)}
        </div>
      </div>

      {/* WEEKLY FLIPS */}
      <div style={card()}>
        <div style={rowBetween()}>
          <div style={row()}>
            <span style={{ fontSize: 16 }}>📅</span>
            <span style={title()}>Weekly Flips</span>
          </div>
          <div style={amountTag(status.weeklyFlipsCompleted, claimable[QUEST_TYPES.WEEKLY_FLIPS])}>
            +{parseFloat(amounts[QUEST_TYPES.WEEKLY_FLIPS] || "0").toFixed(2)} IRYS
          </div>
        </div>

        <div style={rowBetween()}>
          <div style={{ fontSize: 10, color: "#888" }}>
            Progress: {status.weeklyFlips}/50 flips
          </div>
          {claimable[QUEST_TYPES.WEEKLY_FLIPS]
            ? chip(true, "COMPLETED")
            : status.weeklyFlipsCompleted
            ? claimedChip
            : chip(false)}
        </div>
      </div>

      {/* MONTHLY STREAK */}
      <div style={card()}>
        <div style={rowBetween()}>
          <div style={row()}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={title()}>Monthly Streak</span>
          </div>
          <div
            style={amountTag(status.monthlyStreakCompleted, claimable[QUEST_TYPES.MONTHLY_STREAK])}
          >
            +{parseFloat(amounts[QUEST_TYPES.MONTHLY_STREAK] || "0").toFixed(2)} IRYS
          </div>
        </div>

        <div style={rowBetween()}>
          <div style={{ fontSize: 10, color: "#888" }}>
            Streak: {status.monthlyStreak}/30 days
          </div>
          {(() => {
            // Client-side validation for monthly streak - must have 30 days
            const monthlyStreak = parseInt(status.monthlyStreak || '0');
            const hasRequiredStreak = monthlyStreak >= 30;
            const canActuallyClaim = claimable[QUEST_TYPES.MONTHLY_STREAK] && hasRequiredStreak;
            
            if (canActuallyClaim) {
              return chip(true, "COMPLETED");
            } else if (status.monthlyStreakCompleted) {
              return claimedChip;
            } else {
              return chip(false);
            }
          })()}
        </div>
      </div>

      {toast && toastBox(toast)}
    </div>
  );
}

/* — styles — */
const panel = () => ({
  background: "#1a1a1a",
  border: "2px solid #333",
  borderRadius: 12,
  padding: 16,
  marginBottom: 20,
  fontFamily: "'Press Start 2P', monospace",
});
const row = () => ({ display: "flex", alignItems: "center", gap: 8 });
const rowBetween = () => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
});
const hdr = () => ({ fontSize: 14, color: "#fff", fontWeight: "bold" });
const title = () => ({ fontSize: 11, color: "#fff" });
const subtle = () => ({ fontSize: 10, color: "#888" });
const card = () => ({
  marginBottom: 12,
  padding: 12,
  background: "#222",
  borderRadius: 8,
  border: "2px solid #333",
});
const badge = (ok) => ({
  fontSize: 9,
  color: ok ? "#16f06c" : "#666",
  border: `1px solid ${ok ? "#16f06c" : "#444"}`,
  borderRadius: 4,
  padding: "3px 6px",
  background: ok ? "#16f06c22" : "transparent",
});
const amountTag = (completed, claimable) => ({
  fontSize: 9,
  color: claimable ? "#ffb04a" : completed ? "#16f06c" : "#666",
});
const completeBtn = (disabled) => ({
  fontSize: 9,
  background: "#16f06c",
  color: "#111",
  border: "none",
  borderRadius: 4,
  padding: "6px 10px",
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.6 : 1,
});
const rewardBox = (active) => ({
  border: "1px solid #333",
  background: "#151515",
  borderRadius: 8,
  padding: "8px 10px",
  display: "flex",
  alignItems: "center",
  gap: 10,
  boxShadow: active ? "0 0 14px #16f06c33" : "none",
});
const claimBtn = (disabled) => ({
  fontSize: 9,
  background: disabled ? "#333" : "#ffb04a",
  color: "#111",
  border: "1px solid #ffb04a",
  borderRadius: 6,
  padding: "6px 10px",
  cursor: disabled ? "not-allowed" : "pointer",
});
const toastBox = (text) => (
  <div
    style={{
      marginTop: 10,
      background: "#16f06c",
      color: "#111",
      borderRadius: 8,
      padding: "10px 12px",
      fontSize: 12,
      fontWeight: "bold",
      textAlign: "center",
    }}
  >
    {text}
  </div>
);
