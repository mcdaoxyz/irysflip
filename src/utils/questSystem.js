import { ethers } from 'ethers';
import { COINFLIP_ABI } from './coinflipABI.js';

// Contract address - deployed OnchainCoinflip contract
const CONTRACT_ADDRESS = "0xC9F9A1e0C2822663e31c0fCdF46aF0dc10081423";

// Quest types enum (matching smart contract)
export const QUEST_TYPES = {
  DAILY_LOGIN: 0,
  DAILY_FLIP: 1,
  WEEKLY_FLIPS: 2,
  MONTHLY_STREAK: 3
};

// Quest types for onchain (uint8)
export const QUEST_TYPES_ONCHAIN = {
  DAILY_LOGIN: 0,
  DAILY_FLIP: 1,
  WEEKLY_FLIPS: 2,
  MONTHLY_STREAK: 3
};

// Quest rewards (dalam IRYS) - these should match the smart contract
export const QUEST_REWARDS = {
  [QUEST_TYPES.DAILY_LOGIN]: 0.01, // 0.01 IRYS
  [QUEST_TYPES.DAILY_FLIP]: 0.02,  // 0.02 IRYS
  [QUEST_TYPES.WEEKLY_FLIPS]: 0.05, // 0.05 IRYS
  [QUEST_TYPES.MONTHLY_STREAK]: 0.1  // 0.1 IRYS
};

// Quest requirements - updated to match your specifications
export const QUEST_REQUIREMENTS = {
  [QUEST_TYPES.DAILY_LOGIN]: 1,    // 1 login per day
  [QUEST_TYPES.DAILY_FLIP]: 10,    // 10 flips per day
  [QUEST_TYPES.WEEKLY_FLIPS]: 50,  // 50 flips per week
  [QUEST_TYPES.MONTHLY_STREAK]: 30 // 30 days login streak
};

// Automatic quest reset and synchronization system
let resetInterval = null;
let syncInterval = null;
let lastResetDate = null;
let visibilityHandler = null;
let autoLoginCheckInterval = null;
let lastAutoLoginCheck = null;

// Get current UTC date string (YYYY-MM-DD)
const getCurrentUTCDate = () => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Get current user timezone date string (YYYY-MM-DD)
const getCurrentUserDate = () => {
  const now = new Date();
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return now.toLocaleDateString('en-CA', { timeZone: userTimezone }); // YYYY-MM-DD format
};

// Get user timezone offset in hours
const getUserTimezoneOffset = () => {
  const now = new Date();
  return now.getTimezoneOffset() / -60; // Convert to positive hours
};

// Convert user local time to UTC
const convertUserTimeToUTC = (userHour, userMinute) => {
  const offset = getUserTimezoneOffset();
  const utcHour = (userHour - offset + 24) % 24;
  return { hour: utcHour, minute: userMinute };
};

// Check if it's midnight in user's timezone (converted to UTC)
const isUserMidnight = () => {
  const now = new Date();
  const userHour = now.getHours();
  const userMinute = now.getMinutes();
  
  // Convert user's midnight (00:00) to UTC
  const utcTime = convertUserTimeToUTC(0, 0);
  
  return now.getUTCHours() === utcTime.hour && now.getUTCMinutes() < 5;
};

// Auto-detect daily login status
const autoDetectDailyLogin = async (walletAddress) => {
  if (!walletAddress || !window?.ethereum) return;
  
  try {
    const currentDate = getCurrentUserDate();
    const lastCheckKey = `lastAutoLoginCheck_${walletAddress}`;
    const lastCheck = localStorage.getItem(lastCheckKey);
    
    // Only check once per day
    if (lastCheck === currentDate) {
      return;
    }
    
    console.log('🔍 Auto-detecting daily login status...');
    
    const contract = await getContract();
    const questStatus = await contract.getPlayerQuestStatus(walletAddress);
    
    // Check if daily login is completed for today
    if (questStatus && questStatus[0]) { // dailyLoginCompleted
      console.log('✅ Daily login already completed today');
      localStorage.setItem(lastCheckKey, currentDate);
      return true;
    } else {
      console.log('❌ Daily login not completed today');
      localStorage.setItem(lastCheckKey, currentDate);
      return false;
    }
  } catch (error) {
    console.error('Error in auto-detect daily login:', error);
    return null;
  }
};

// Auto-complete daily login if not done yet
export const autoCompleteDailyLogin = async (walletAddress) => {
  if (!walletAddress || !window?.ethereum) return;
  
  try {
    console.log('🚀 Attempting auto-complete daily login...');
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getContract(signer);
    
    // Check if already completed
    const questStatus = await contract.getPlayerQuestStatus(walletAddress);
    if (questStatus && questStatus[0]) {
      console.log('✅ Daily login already completed - no action needed');
      return { success: true, message: 'Daily login already completed', alreadyCompleted: true };
    }
    
    // Try to complete daily login
    const tx = await contract.completeDailyLogin();
    await tx.wait();
    
    // Mark as auto-completed for today
    const currentDate = new Date().toISOString().split('T')[0];
    const lastAutoCompleteKey = `lastAutoComplete_${walletAddress}`;
    localStorage.setItem(lastAutoCompleteKey, currentDate);
    
    console.log('🎉 Auto-complete daily login successful!');
    return { success: true, message: 'Daily login auto-completed successfully!' };
  } catch (error) {
    console.error('Error in auto-complete daily login:', error);
    
    // If already completed, treat as success
    if (error.message && error.message.includes('Daily login already completed')) {
      return { success: true, message: 'Daily login already completed', alreadyCompleted: true };
    }
    
    return { success: false, message: error.message || 'Failed to auto-complete daily login' };
  }
};

// Check if it's time for daily reset (12:00 AM user timezone)
const isTimeForDailyReset = () => {
  const now = new Date();
  const currentDate = getCurrentUserDate();
  
  // Check if we've already reset today
  if (lastResetDate === currentDate) {
    return false;
  }
  
  // Check if it's midnight in user's timezone (converted to UTC)
  const isUserMidnightTime = isUserMidnight();
  const isNewDay = lastResetDate !== currentDate;
  
  return isUserMidnightTime || isNewDay;
};

// Check if it's time for weekly reset (Monday 12:00 AM user timezone)
const isTimeForWeeklyReset = () => {
  const now = new Date();
  const currentWeek = getCurrentWeek();
  const lastWeekResetKey = 'lastWeekReset';
  const lastWeekReset = localStorage.getItem(lastWeekResetKey);
  
  // Check if it's Monday (day 1) and midnight in user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userDay = now.toLocaleDateString('en-US', { timeZone: userTimezone, weekday: 'long' });
  const isMonday = userDay === 'Monday';
  const isUserMidnightTime = isUserMidnight();
  
  if (isMonday && isUserMidnightTime && lastWeekReset !== currentWeek.toString()) {
    localStorage.setItem(lastWeekResetKey, currentWeek.toString());
    return true;
  }
  
  return false;
};

// Check if it's time for monthly reset (1st day of month 12:00 AM user timezone)
const isTimeForMonthlyReset = () => {
  const now = new Date();
  const currentMonth = getCurrentMonth();
  const lastMonthResetKey = 'lastMonthReset';
  const lastMonthReset = localStorage.getItem(lastMonthResetKey);
  
  // Check if it's 1st day of month and midnight in user's timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const userDate = now.toLocaleDateString('en-US', { timeZone: userTimezone, day: 'numeric' });
  const isFirstDay = parseInt(userDate) === 1;
  const isUserMidnightTime = isUserMidnight();
  
  if (isFirstDay && isUserMidnightTime && lastMonthReset !== currentMonth) {
    localStorage.setItem(lastMonthResetKey, currentMonth);
    return true;
  }
  
  return false;
};

// Clear all local quest data automatically
const clearLocalQuestData = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('quest') || 
        key.includes('daily') || 
        key.includes('weekly') || 
        key.includes('monthly') || 
        key.includes('streak') || 
        key.includes('flip') || 
        key.includes('login') ||
        key.includes('reward') ||
        key.includes('virtual') ||
        key.includes('balance') ||
        key.includes('earned') ||
        key.includes('claim')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Auto-cleared local storage key: ${key}`);
    });
    
    console.log('Automatic local quest data clear completed');
    return true;
  } catch (error) {
    console.error('Error in automatic local quest data clear:', error);
    return false;
  }
};

// Clear daily quest data
const clearDailyQuestData = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('daily') || 
        key.includes('login') ||
        key.includes('dailyLogin') ||
        key.includes('dailyFlip')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Cleared daily quest key: ${key}`);
    });
    
    console.log('Daily quest data clear completed');
    return true;
  } catch (error) {
    console.error('Error in daily quest data clear:', error);
    return false;
  }
};

// Clear weekly quest data
const clearWeeklyQuestData = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('weekly') || 
        key.includes('weekFlips') ||
        key.includes('weeklyFlips')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Cleared weekly quest key: ${key}`);
    });
    
    console.log('Weekly quest data clear completed');
    return true;
  } catch (error) {
    console.error('Error in weekly quest data clear:', error);
    return false;
  }
};

// Clear monthly quest data
const clearMonthlyQuestData = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('monthly') || 
        key.includes('streak') ||
        key.includes('monthlyStreak')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Cleared monthly quest key: ${key}`);
    });
    
    console.log('Monthly quest data clear completed');
    return true;
  } catch (error) {
    console.error('Error in monthly quest data clear:', error);
    return false;
  }
};

// Force refresh quest data from smart contract
const forceRefreshQuestData = async (walletAddress) => {
  if (!walletAddress || !window?.ethereum) return;
  
  try {
    console.log('🔄 Automatic quest data refresh triggered');
    
    // Clear any cached data
    clearLocalQuestData();
    
    // Force refresh from smart contract
    const contract = await getContract();
    const questStatus = await contract.getPlayerQuestStatus(walletAddress);
    
    // Check if quest status seems inconsistent (all completed but shouldn't be)
    const currentDate = getCurrentUTCDate();
    const lastLoginDate = questStatus[4] ? new Date(Number(questStatus[4]) * 1000).toISOString().split('T')[0] : null;
    
    // If daily login shows completed but last login date is not today, force reset
    if (questStatus[0] && lastLoginDate !== currentDate) {
      console.log('⚠️ Inconsistent quest status detected - forcing reset');
      clearLocalQuestData();
      return false;
    }
    
    console.log('✅ Automatic quest data refresh completed');
    return true;
  } catch (error) {
    console.error('❌ Error in automatic quest data refresh:', error);
    return false;
  }
};

// Initialize automatic quest reset system
export const initializeAutoQuestReset = (walletAddress) => {
  // Clear existing intervals
  if (resetInterval) clearInterval(resetInterval);
  if (syncInterval) clearInterval(syncInterval);
  if (autoLoginCheckInterval) clearInterval(autoLoginCheckInterval);
  
  // Check for all types of reset every minute
  resetInterval = setInterval(() => {
    // Daily reset (every day at 12:00 AM user timezone)
    if (isTimeForDailyReset()) {
      console.log('🕛 Daily reset detected - resetting daily quests');
      lastResetDate = getCurrentUserDate();
      
      // Clear daily quest data
      clearDailyQuestData();
      
      // Force refresh from smart contract
      forceRefreshQuestData(walletAddress);
      
      console.log('🔄 Daily reset completed - daily quests refreshed');
    }
    
    // Weekly reset (every Monday at 12:00 AM user timezone)
    if (isTimeForWeeklyReset()) {
      console.log('🕛 Weekly reset detected - resetting weekly quests');
      
      // Clear weekly quest data
      clearWeeklyQuestData();
      
      // Force refresh from smart contract
      forceRefreshQuestData(walletAddress);
      
      console.log('🔄 Weekly reset completed - weekly quests refreshed');
    }
    
    // Monthly reset (every 1st day of month at 12:00 AM user timezone)
    if (isTimeForMonthlyReset()) {
      console.log('🕛 Monthly reset detected - resetting monthly quests');
      
      // Clear monthly quest data
      clearMonthlyQuestData();
      
      // Force refresh from smart contract
      forceRefreshQuestData(walletAddress);
      
      console.log('🔄 Monthly reset completed - monthly quests refreshed');
    }
  }, 60000); // Check every minute
  
  // Sync with smart contract every 60 seconds for less disruption
  syncInterval = setInterval(() => {
    if (walletAddress) {
      forceRefreshQuestData(walletAddress);
    }
  }, 60000); // Sync every 60 seconds
  
  // Auto-detect and auto-complete daily login every 2 minutes
  autoLoginCheckInterval = setInterval(async () => {
    if (walletAddress) {
      // First detect if daily login is needed
      const isCompleted = await autoDetectDailyLogin(walletAddress);
      
      // If not completed, try to auto-complete
      if (isCompleted === false) {
        console.log('🔄 Daily login not completed - attempting auto-complete...');
        const result = await autoCompleteDailyLogin(walletAddress);
        if (result?.success) {
          console.log('✅ Auto-complete daily login result:', result.message);
        }
      }
    }
  }, 120000); // Check every 2 minutes
  
  // Handle page visibility changes to ensure reset works when tab becomes visible
  visibilityHandler = () => {
    if (!document.hidden && walletAddress) {
      console.log('📱 Page became visible - checking for missed reset and daily login');
      const currentDate = getCurrentUTCDate();
      
      // If we haven't reset today, trigger reset immediately
      if (lastResetDate !== currentDate) {
          console.log('🕛 Missed reset detected - triggering now');
          lastResetDate = currentDate;
          clearLocalQuestData();
          forceRefreshQuestData(walletAddress);
        
        // Show notification instead of page refresh
        console.log('🔄 Missed reset completed - data refreshed automatically');
      }
      
      // Also check and auto-complete daily login when page becomes visible
      setTimeout(async () => {
        const isCompleted = await autoDetectDailyLogin(walletAddress);
        if (isCompleted === false) {
          console.log('🔄 Page visible - attempting auto-complete daily login...');
          const result = await autoCompleteDailyLogin(walletAddress);
          if (result?.success) {
            console.log('✅ Auto-complete daily login on page visible:', result.message);
          }
        }
      }, 2000);
    }
  };
  
  // Add visibility change listener
  document.addEventListener('visibilitychange', visibilityHandler);
  
  console.log('🚀 Automatic quest reset and sync system initialized');
};

// Cleanup function
export const cleanupAutoQuestReset = () => {
  if (resetInterval) {
    clearInterval(resetInterval);
    resetInterval = null;
  }
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (autoLoginCheckInterval) {
    clearInterval(autoLoginCheckInterval);
    autoLoginCheckInterval = null;
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
  console.log('🧹 Automatic quest reset system cleaned up');
};

// Get contract instance
const getContract = async (signer = null) => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found');
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const contractInstance = new ethers.Contract(
    CONTRACT_ADDRESS,
    COINFLIP_ABI,
    signer || provider
  );
  
  return contractInstance;
};

// Get player data from smart contract
export const getPlayerData = async (playerAddress) => {
  try {
    const contract = await getContract();
    const playerData = await contract.getPlayerData(playerAddress);
    return playerData;
  } catch (error) {
    console.error('Error getting player data:', error);
    return null;
  }
};

// Get player quest status from smart contract
export const getPlayerQuestStatus = async (playerAddress) => {
  try {
    const contract = await getContract();
    const questStatus = await contract.getPlayerQuestStatus(playerAddress);
    
    // Validate quest status consistency
    const currentDate = getCurrentUTCDate();
    const lastLoginDate = questStatus[4] ? new Date(Number(questStatus[4]) * 1000).toISOString().split('T')[0] : null;
    
    // If daily login shows completed but last login date is not today, reset it
    let dailyLoginCompleted = questStatus[0];
    if (dailyLoginCompleted && lastLoginDate !== currentDate) {
      console.log('🔄 Resetting inconsistent daily login status');
      dailyLoginCompleted = false;
    }
    
    return {
      dailyLoginCompleted: dailyLoginCompleted,
      dailyFlipCompleted: questStatus[1],
      weeklyFlipsCompleted: questStatus[2],
      monthlyStreakCompleted: questStatus[3],
      dailyFlipsToday: questStatus[4].toString(),
      weeklyFlips: questStatus[5].toString(),
      monthlyStreak: questStatus[6].toString()
    };
  } catch (error) {
    console.error('Error getting quest status:', error);
    return null;
  }
};

// Check if daily login is completed on smart contract
export async function checkDailyLoginCompleted(playerAddress) {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = await getContract(provider);
    
    // Try to check if daily login is completed
    try {
      const isCompleted = await contract.isDailyLoginCompleted(playerAddress);
      return isCompleted;
    } catch (checkError) {
      // If isDailyLoginCompleted function doesn't exist, return null
      console.log('isDailyLoginCompleted function not available');
      return null;
    }
  } catch (error) {
    console.error('Error checking daily login status:', error);
    return null;
  }
}

// Check quest completion status on smart contract
export async function checkQuestCompletionStatus(playerAddress, questType) {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = await getContract(provider);
    
    switch (questType) {
      case QUEST_TYPES.DAILY_LOGIN:
        try {
          return await contract.isDailyLoginCompleted(playerAddress);
        } catch (error) {
          console.log('isDailyLoginCompleted function not available');
          return null;
        }
      case QUEST_TYPES.DAILY_FLIP:
        try {
          const playerData = await contract.getPlayerData(playerAddress);
          return playerData.dailyFlipCompleted;
        } catch (error) {
          console.log('getPlayerData function not available');
          return null;
        }
      case QUEST_TYPES.WEEKLY_FLIPS:
        try {
          const playerData = await contract.getPlayerData(playerAddress);
          return playerData.weeklyFlipsCompleted;
        } catch (error) {
          console.log('getPlayerData function not available');
          return null;
        }
      case QUEST_TYPES.MONTHLY_STREAK:
        try {
          const playerData = await contract.getPlayerData(playerAddress);
          return playerData.monthlyStreakCompleted;
        } catch (error) {
          console.log('getPlayerData function not available');
          return null;
        }
      default:
        return null;
    }
  } catch (error) {
    console.error('Error checking quest completion status:', error);
    return null;
  }
}

// Check if quest reward is already claimed
export async function isQuestRewardClaimed(contract, playerAddress, questType) {
  try {
    if (!contract || !contract.getQuestRewardAmount) {
      return null;
    }
    
    // Map quest type to onchain type
    let questTypeOnchain;
    switch (questType) {
      case QUEST_TYPES.DAILY_LOGIN:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.DAILY_LOGIN;
        break;
      case QUEST_TYPES.DAILY_FLIP:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.DAILY_FLIP;
        break;
      case QUEST_TYPES.WEEKLY_FLIPS:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.WEEKLY_FLIPS;
        break;
      case QUEST_TYPES.MONTHLY_STREAK:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.MONTHLY_STREAK;
        break;
      default:
        return null;
    }
    
    const rewardAmount = await contract.getQuestRewardAmount(playerAddress, questTypeOnchain);
    // If reward amount is 0, it means reward is already claimed
    return rewardAmount.toString() === '0';
  } catch (error) {
    console.error('Error checking if quest reward is claimed:', error);
    return null;
  }
}

// Complete daily login quest on smart contract
export async function completeDailyLoginOnContract() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getContract(signer);
    
    // Check if daily login is already completed on contract
    try {
      const isCompleted = await contract.isDailyLoginCompleted(signer.address);
      if (isCompleted) {
        return { success: true, message: 'Daily login quest already completed today!', alreadyCompleted: true };
      }
    } catch (checkError) {
      // If isDailyLoginCompleted function doesn't exist, proceed with completion
      console.log('isDailyLoginCompleted function not available, proceeding with completion');
    }
    
    // Also check quest status to see if daily login is completed
    try {
      const questStatus = await contract.getPlayerQuestStatus(signer.address);
      if (questStatus && questStatus[0]) { // dailyLoginCompleted is first element
        return { success: true, message: 'Daily login quest already completed today!', alreadyCompleted: true };
      }
    } catch (statusError) {
      console.log('Could not check quest status, proceeding with completion');
    }
    
    const tx = await contract.completeDailyLogin();
    await tx.wait();
    
    return { success: true, message: 'Daily login quest completed!' };
  } catch (error) {
    console.error('Error completing daily login:', error);
    
    // Handle specific error for already completed daily login
    if (error.message && error.message.includes('Daily login already completed')) {
      return { success: true, message: 'Daily login quest already completed today!', alreadyCompleted: true };
    }
    
    return { success: false, message: error.message || 'Failed to complete daily login quest.' };
  }
}

// Claim daily login reward from smart contract
export async function claimDailyLoginReward() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getContract(signer);
    const playerAddress = await signer.getAddress();
    
    // Check if daily login is completed before claiming
    try {
      const isCompleted = await contract.isDailyLoginCompleted(playerAddress);
      if (!isCompleted) {
        return { success: false, message: 'Daily login quest not completed yet. Please complete the quest first.' };
      }
    } catch (checkError) {
      console.log('isDailyLoginCompleted function not available, proceeding with claim');
    }
    
    // Check if reward can be claimed
    try {
      const canClaim = await contract.canClaimQuestReward(playerAddress, QUEST_TYPES.DAILY_LOGIN);
      if (!canClaim) {
        return { success: false, message: 'Daily login reward already claimed or not available.' };
      }
    } catch (checkError) {
      console.log('canClaimQuestReward function not available, proceeding with claim');
    }
    
    const tx = await contract.claimQuestReward(QUEST_TYPES.DAILY_LOGIN);
    const receipt = await tx.wait();
    
    // Get reward amount from event logs
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'QuestRewardClaimed';
      } catch {
        return false;
      }
    });
    
    let rewardAmount = '0';
    if (event) {
      const parsed = contract.interface.parseLog(event);
      rewardAmount = ethers.formatEther(parsed.args.amount);
    }
    
    return { 
      success: true, 
      message: `Daily login reward claimed! +${rewardAmount} IRYS`,
      amount: rewardAmount,
      isVirtual: false
    };
  } catch (error) {
    console.error('Error claiming daily login reward:', error);
    
    // Handle specific error messages
    if (error.message && error.message.includes('Quest reward already claimed')) {
      return { success: false, message: 'Daily login reward already claimed today.' };
    }
    
    if (error.message && error.message.includes('Quest not completed')) {
      return { success: false, message: 'Daily login quest not completed yet. Please complete the quest first.' };
    }
    
    if (error.message && error.message.includes('No rewards available')) {
      return { success: false, message: 'No daily login rewards available to claim.' };
    }
    
    return { success: false, message: error.message || 'Failed to claim daily login reward. Please try again.' };
  }
}

// Debug function to check quest status on smart contract
export async function debugQuestStatus(playerAddress) {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getContract(signer);
    
    // Get player data from smart contract
    const playerData = await contract.getPlayerData(playerAddress);
    console.log('Smart contract player data:', {
      dailyFlipsToday: playerData.dailyFlipsToday.toString(),
      dailyFlipCompleted: playerData.dailyFlipCompleted,
      lastFlipDate: new Date(Number(playerData.lastFlipDate) * 1000).toISOString()
    });
    
    // Check if can claim daily flip reward
    const canClaim = await contract.canClaimQuestReward(playerAddress, QUEST_TYPES.DAILY_FLIP);
    console.log('Can claim daily flip reward:', canClaim);
    
    // Get reward amount
    const rewardAmount = await contract.getQuestRewardAmount(playerAddress, QUEST_TYPES.DAILY_FLIP);
    console.log('Daily flip reward amount:', ethers.formatEther(rewardAmount));
    
    return {
      dailyFlipsToday: playerData.dailyFlipsToday.toString(),
      dailyFlipCompleted: playerData.dailyFlipCompleted,
      canClaim,
      rewardAmount: ethers.formatEther(rewardAmount)
    };
  } catch (error) {
    console.error('Error debugging quest status:', error);
    return null;
  }
}

// Claim daily flip reward from smart contract
export async function claimDailyFlipReward() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getContract(signer);
    const playerAddress = await signer.getAddress();
    
    // Debug quest status before claiming
    console.log('=== DEBUG: Quest status before claiming ===');
    await debugQuestStatus(playerAddress);
    
    const tx = await contract.claimQuestReward(QUEST_TYPES.DAILY_FLIP);
    const receipt = await tx.wait();
    
    // Get reward amount from event logs
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'QuestRewardClaimed';
      } catch {
        return false;
      }
    });
    
    let rewardAmount = '0';
    if (event) {
      const parsed = contract.interface.parseLog(event);
      rewardAmount = ethers.formatEther(parsed.args.amount);
    }
    
    return { 
      success: true, 
      message: `Daily flip reward claimed! +${rewardAmount} IRYS`,
      amount: rewardAmount,
      isVirtual: false
    };
  } catch (error) {
    console.error('Error claiming daily flip reward:', error);
    return { success: false, message: error.message || 'Failed to claim reward. Please try again.' };
  }
}

// Claim weekly flips reward from smart contract
export async function claimWeeklyFlipsReward() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getContract(signer);
    
    const tx = await contract.claimQuestReward(QUEST_TYPES.WEEKLY_FLIPS);
    const receipt = await tx.wait();
    
    // Get reward amount from event logs
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'QuestRewardClaimed';
      } catch {
        return false;
      }
    });
    
    let rewardAmount = '0';
    if (event) {
      const parsed = contract.interface.parseLog(event);
      rewardAmount = ethers.formatEther(parsed.args.amount);
    }
    
    return { 
      success: true, 
      message: `Weekly flips reward claimed! +${rewardAmount} IRYS`,
      amount: rewardAmount,
      isVirtual: false
    };
  } catch (error) {
    console.error('Error claiming weekly flips reward:', error);
    return { success: false, message: error.message || 'Failed to claim reward. Please try again.' };
  }
}

// Claim monthly streak reward from smart contract
export async function claimMonthlyStreakReward() {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getContract(signer);
    
    const tx = await contract.claimQuestReward(QUEST_TYPES.MONTHLY_STREAK);
    const receipt = await tx.wait();
    
    // Get reward amount from event logs
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'QuestRewardClaimed';
      } catch {
        return false;
      }
    });
    
    let rewardAmount = '0';
    if (event) {
      const parsed = contract.interface.parseLog(event);
      rewardAmount = ethers.formatEther(parsed.args.amount);
    }
    
    return { 
      success: true, 
      message: `Monthly streak reward claimed! +${rewardAmount} IRYS`,
      amount: rewardAmount,
      isVirtual: false
    };
  } catch (error) {
    console.error('Error claiming monthly streak reward:', error);
    return { success: false, message: error.message || 'Failed to claim reward. Please try again.' };
  }
}

 export async function refreshOnchainStatus(playerAddress) {
   try {
     return await getPlayerQuestStatus(playerAddress);
   } catch {
     return null;
   }
 }

 export function formatEth(x) {
   if (x == null) return '0';
   const n = Number(x);
   return Number.isFinite(n) ? n.toString() : x;
}

// Onchain quest reward functions
export async function canClaimQuestReward(contract, playerAddress, questType) {
  try {
    console.log('canClaimQuestReward called with:', { contract, playerAddress, questType });
    console.log('QUEST_TYPES_ONCHAIN:', QUEST_TYPES_ONCHAIN);
    
    if (!contract) {
      console.error('Contract not available');
      return false;
    }
    
    if (!contract.canClaimQuestReward || typeof contract.canClaimQuestReward !== 'function') {
      console.error('canClaimQuestReward method not available or not a function');
      return false;
    }
    
    // Map quest type string to onchain type
    let questTypeOnchain;
    switch (questType) {
      case QUEST_TYPES.DAILY_LOGIN:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.DAILY_LOGIN;
        break;
      case QUEST_TYPES.DAILY_FLIP:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.DAILY_FLIP;
        break;
      case QUEST_TYPES.WEEKLY_FLIPS:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.WEEKLY_FLIPS;
        break;
      case QUEST_TYPES.MONTHLY_STREAK:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.MONTHLY_STREAK;
        break;
      default:
        console.error('Invalid quest type:', questType);
        return false;
    }
    
    console.log('questTypeOnchain:', questTypeOnchain);
    console.log('questTypeOnchain type:', typeof questTypeOnchain);
    console.log('contract.canClaimQuestReward:', contract.canClaimQuestReward);
    console.log('contract methods:', Object.keys(contract));
    
    // Get additional debug info and validate monthly streak requirement
    try {
      const playerData = await contract.getPlayerData(playerAddress);
      console.log('Player data for debugging:', {
        dailyLoginCompleted: playerData.dailyLoginCompleted,
        dailyFlipCompleted: playerData.dailyFlipCompleted,
        weeklyFlipsCompleted: playerData.weeklyFlipsCompleted,
        monthlyStreakCompleted: playerData.monthlyStreakCompleted,
        dailyFlipsToday: playerData.dailyFlipsToday?.toString(),
        weeklyFlips: playerData.weeklyFlips?.toString(),
        monthlyStreak: playerData.monthlyStreak?.toString()
      });
      
      // Additional validation for monthly streak - must have 30 days before claiming
      if (questType === QUEST_TYPES.MONTHLY_STREAK) {
        const monthlyStreak = Number(playerData.monthlyStreak?.toString() || '0');
        console.log('Monthly streak validation:', { monthlyStreak, required: 30 });
        
        if (monthlyStreak < 30) {
          console.log('Monthly streak requirement not met: need 30 days, have', monthlyStreak);
          return false;
        }
      }
    } catch (debugError) {
      console.log('Could not get player data for debugging:', debugError.message);
    }
    
    // Check if the method returns a promise
    const result = contract.canClaimQuestReward(playerAddress, questTypeOnchain);
    if (result && typeof result.then === 'function') {
      const canClaim = await result;
      console.log('canClaim result:', canClaim);
      
      // Additional client-side validation for monthly streak
      if (questType === QUEST_TYPES.MONTHLY_STREAK && canClaim) {
        try {
          const playerData = await contract.getPlayerData(playerAddress);
          const monthlyStreak = Number(playerData.monthlyStreak?.toString() || '0');
          
          if (monthlyStreak < 30) {
            console.log('Monthly streak client-side validation failed: need 30 days, have', monthlyStreak);
            return false;
          }
        } catch (validationError) {
          console.log('Could not validate monthly streak:', validationError.message);
          return false;
        }
      }
      
      // If canClaim is false, try to get more info about why
      if (!canClaim) {
        try {
          const rewardAmount = await contract.getQuestRewardAmount(playerAddress, questTypeOnchain);
          console.log('Quest reward amount:', ethers.formatEther(rewardAmount));
          
          // Check if reward amount is 0 (already claimed)
          if (rewardAmount.toString() === '0') {
            console.log('Reward amount is 0 - likely already claimed');
          }
        } catch (rewardError) {
          console.log('Could not get reward amount:', rewardError.message);
        }
      }
      
      return canClaim;
    } else {
      console.error('canClaimQuestReward did not return a promise');
      return false;
    }
  } catch (error) {
    console.error('Error checking if can claim quest reward:', error);
    return false;
  }
}

export async function getQuestRewardAmount(contract, playerAddress, questType) {
  try {
    if (!contract) {
      console.error('Contract not available');
      return ethers.parseUnits('0', 'ether');
    }
    
    if (!contract.getQuestRewardAmount || typeof contract.getQuestRewardAmount !== 'function') {
      console.error('getQuestRewardAmount method not available or not a function');
      return ethers.parseUnits('0', 'ether');
    }
    
    // Map quest type string to onchain type
    let questTypeOnchain;
    switch (questType) {
      case QUEST_TYPES.DAILY_LOGIN:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.DAILY_LOGIN;
        break;
      case QUEST_TYPES.DAILY_FLIP:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.DAILY_FLIP;
        break;
      case QUEST_TYPES.WEEKLY_FLIPS:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.WEEKLY_FLIPS;
        break;
      case QUEST_TYPES.MONTHLY_STREAK:
        questTypeOnchain = QUEST_TYPES_ONCHAIN.MONTHLY_STREAK;
        break;
      default:
        console.error('Invalid quest type:', questType);
        return ethers.parseUnits('0', 'ether');
    }
    
    const result = contract.getQuestRewardAmount(playerAddress, questTypeOnchain);
    if (result && typeof result.then === 'function') {
      const rewardAmount = await result;
      return rewardAmount;
    } else {
      console.error('getQuestRewardAmount did not return a promise');
      return ethers.parseUnits('0', 'ether');
    }
  } catch (error) {
    console.error('Error getting quest reward amount:', error);
    return ethers.parseUnits('0', 'ether');
  }
}

// Claim quest reward from smart contract
export async function claimQuestReward(questType) {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = await getContract(signer);
    const playerAddress = await signer.getAddress();
    
    // Check if quest is completed before claiming
    try {
      const questNames = {
        [QUEST_TYPES.DAILY_LOGIN]: 'Daily Login',
        [QUEST_TYPES.DAILY_FLIP]: 'Daily Flip',
        [QUEST_TYPES.WEEKLY_FLIPS]: 'Weekly Flips',
        [QUEST_TYPES.MONTHLY_STREAK]: 'Monthly Streak'
      };
      
      // Check if quest is completed
      const isCompleted = await checkQuestCompletionStatus(playerAddress, questType);
      if (isCompleted === false) {
        return { success: false, message: `${questNames[questType]} quest not completed yet. Please complete the quest first.` };
      }
    } catch (checkError) {
      console.log('Quest completion check not available, proceeding with claim');
    }
    
    // Check if reward can be claimed
    try {
      const canClaim = await contract.canClaimQuestReward(playerAddress, questType);
      if (!canClaim) {
        const questNames = {
          [QUEST_TYPES.DAILY_LOGIN]: 'Daily Login',
          [QUEST_TYPES.DAILY_FLIP]: 'Daily Flip',
          [QUEST_TYPES.WEEKLY_FLIPS]: 'Weekly Flips',
          [QUEST_TYPES.MONTHLY_STREAK]: 'Monthly Streak'
        };
        return { success: false, message: `${questNames[questType]} reward already claimed or not available.` };
      }
    } catch (checkError) {
      console.log('canClaimQuestReward function not available, proceeding with claim');
    }
    
    const tx = await contract.claimQuestReward(questType);
    const receipt = await tx.wait();
    
    // Get reward amount from event logs
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed.name === 'QuestRewardClaimed';
      } catch {
        return false;
      }
    });
    
    let rewardAmount = '0';
    if (event) {
      const parsed = contract.interface.parseLog(event);
      rewardAmount = ethers.formatEther(parsed.args.amount);
    }
    
    const questNames = {
      [QUEST_TYPES.DAILY_LOGIN]: 'Daily Login',
      [QUEST_TYPES.DAILY_FLIP]: 'Daily Flip',
      [QUEST_TYPES.WEEKLY_FLIPS]: 'Weekly Flips',
      [QUEST_TYPES.MONTHLY_STREAK]: 'Monthly Streak'
    };
    
    return { 
      success: true, 
      message: `${questNames[questType]} reward claimed! +${rewardAmount} IRYS`,
      amount: rewardAmount,
      isVirtual: false
    };
  } catch (error) {
    console.error('Error claiming quest reward:', error);
    
    const questNames = {
      [QUEST_TYPES.DAILY_LOGIN]: 'Daily Login',
      [QUEST_TYPES.DAILY_FLIP]: 'Daily Flip',
      [QUEST_TYPES.WEEKLY_FLIPS]: 'Weekly Flips',
      [QUEST_TYPES.MONTHLY_STREAK]: 'Monthly Streak'
    };
    
    // Handle specific error messages
    if (error.message && error.message.includes('Quest reward already claimed')) {
      return { success: false, message: `${questNames[questType]} reward already claimed today.` };
    }
    
    if (error.message && error.message.includes('Quest not completed')) {
      return { success: false, message: `${questNames[questType]} quest not completed yet. Please complete the quest first.` };
    }
    
    if (error.message && error.message.includes('No rewards available')) {
      return { success: false, message: `No ${questNames[questType]} rewards available to claim.` };
    }
    
    return { success: false, message: error.message || `Failed to claim ${questNames[questType]} reward. Please try again.` };
  }
}

// Helper function to get current week number
function getCurrentWeek() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now - start;
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek);
}

// Helper function to get current month
function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}



// Clear all local storage quest data - this function removes all local storage dependencies
export function clearAllLocalQuestData() {
  try {
    // Clear all quest-related localStorage data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('quest') || 
        key.includes('daily') || 
        key.includes('weekly') || 
        key.includes('monthly') || 
        key.includes('streak') || 
        key.includes('flip') || 
        key.includes('login') ||
        key.includes('reward') ||
        key.includes('virtual') ||
        key.includes('balance') ||
        key.includes('earned') ||
        key.includes('claim')
      )) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed local storage key: ${key}`);
    });
    
    console.log('All local quest data cleared successfully');
    return { success: true, message: 'All local quest data cleared successfully!' };
  } catch (error) {
    console.error('Error clearing local quest data:', error);
    return { success: false, message: 'Failed to clear local quest data: ' + error.message };
  }
}

// Get quest requirements from smart contract
export async function getQuestRequirements() {
  try {
    const contract = await getContract();
    const dailyFlipReq = await contract.DAILY_FLIP_REQUIREMENT();
    const weeklyFlipsReq = await contract.WEEKLY_FLIP_REQUIREMENT();
    const monthlyStreakReq = await contract.MONTHLY_STREAK_REQUIREMENT();
    
    console.log('Smart contract quest requirements:', {
      dailyFlip: Number(dailyFlipReq.toString()),
      weeklyFlips: Number(weeklyFlipsReq.toString()),
      monthlyStreak: Number(monthlyStreakReq.toString())
    });
    
    const requirements = {
      dailyFlip: Number(dailyFlipReq.toString()),
      weeklyFlips: Number(weeklyFlipsReq.toString()),
      monthlyStreak: Number(monthlyStreakReq.toString())
    };
    
    // Override with our specifications if contract values don't match
    if (requirements.dailyFlip !== 10) {
      console.log(`Daily flip requirement from contract is ${requirements.dailyFlip}, overriding to 10`);
      requirements.dailyFlip = 10;
    }
    
    if (requirements.weeklyFlips !== 50) {
      console.log(`Weekly flips requirement from contract is ${requirements.weeklyFlips}, overriding to 50`);
      requirements.weeklyFlips = 50;
    }
    
    if (requirements.monthlyStreak !== 30) {
      console.log(`Monthly streak requirement from contract is ${requirements.monthlyStreak}, overriding to 30`);
      requirements.monthlyStreak = 30;
    }
    
    return requirements;
  } catch (error) {
    console.error('Error getting quest requirements:', error);
    // Return our specified values if contract call fails
    return {
      dailyFlip: 10,
      weeklyFlips: 50,
      monthlyStreak: 30
    };
  }
}

// Get quest progress percentage based on smart contract data
export function getQuestProgress(status, questType, requirements) {
  if (!status || !requirements) return 0;
  
  switch (questType) {
    case QUEST_TYPES.DAILY_LOGIN:
      return status.dailyLoginCompleted ? 100 : 0;
    case QUEST_TYPES.DAILY_FLIP:
      const dailyFlips = parseInt(status.dailyFlipsToday) || 0;
      const dailyFlipProgress = Math.min((dailyFlips / 10) * 100, 100); // 10 flips required
      return dailyFlipProgress;
    case QUEST_TYPES.WEEKLY_FLIPS:
      const weeklyFlips = parseInt(status.weeklyFlips) || 0;
      const weeklyFlipProgress = Math.min((weeklyFlips / 50) * 100, 100); // 50 flips required
      return weeklyFlipProgress;
    case QUEST_TYPES.MONTHLY_STREAK:
      const monthlyStreak = parseInt(status.monthlyStreak) || 0;
      const monthlyStreakProgress = Math.min((monthlyStreak / 30) * 100, 100); // 30 days required
      return monthlyStreakProgress;
    default:
      return 0;
  }
}

// Get total available rewards from smart contract
export async function getTotalAvailableRewards(contract, playerAddress) {
  try {
    if (!contract || !playerAddress) return 0;
    
    let total = 0;
    const questTypes = [QUEST_TYPES.DAILY_LOGIN, QUEST_TYPES.DAILY_FLIP, QUEST_TYPES.WEEKLY_FLIPS, QUEST_TYPES.MONTHLY_STREAK];
    
    for (const questType of questTypes) {
      try {
        const canClaim = await canClaimQuestReward(contract, playerAddress, questType);
        if (canClaim) {
          const rewardAmount = await getQuestRewardAmount(contract, playerAddress, questType);
          total += parseFloat(ethers.formatEther(rewardAmount));
        }
      } catch (error) {
        console.error(`Error checking reward for quest type ${questType}:`, error);
      }
    }
    
    return total;
  } catch (error) {
    console.error('Error getting total available rewards:', error);
    return 0;
  }
}

// Format reward amount
export function formatReward(amount) {
  return `${amount} IRYS`;
}

// Check quest status from smart contract
export async function checkQuestStatusFromContract(playerAddress) {
  try {
    const status = await getPlayerQuestStatus(playerAddress);
    const requirements = await getQuestRequirements();
    
    if (!status || !requirements) {
      return null;
    }
    
    return {
      dailyLogin: {
        completed: status.dailyLoginCompleted,
        canComplete: !status.dailyLoginCompleted,
        progress: getQuestProgress(status, QUEST_TYPES.DAILY_LOGIN, requirements),
        reward: QUEST_REWARDS[QUEST_TYPES.DAILY_LOGIN]
      },
      dailyFlip: {
        completed: status.dailyFlipCompleted,
        canComplete: parseInt(status.dailyFlipsToday) >= 10 && !status.dailyFlipCompleted, // 10 flips required
        progress: getQuestProgress(status, QUEST_TYPES.DAILY_FLIP, requirements),
        flipsToday: parseInt(status.dailyFlipsToday) || 0,
        required: 10,
        reward: QUEST_REWARDS[QUEST_TYPES.DAILY_FLIP]
      },
      weeklyFlips: {
        completed: status.weeklyFlipsCompleted,
        canComplete: parseInt(status.weeklyFlips) >= 50 && !status.weeklyFlipsCompleted, // 50 flips required
        progress: getQuestProgress(status, QUEST_TYPES.WEEKLY_FLIPS, requirements),
        currentCount: parseInt(status.weeklyFlips) || 0,
        required: 50,
        reward: QUEST_REWARDS[QUEST_TYPES.WEEKLY_FLIPS]
      },
      monthlyStreak: {
        completed: status.monthlyStreakCompleted,
        canComplete: parseInt(status.monthlyStreak) >= 30 && !status.monthlyStreakCompleted, // 30 days required
        progress: getQuestProgress(status, QUEST_TYPES.MONTHLY_STREAK, requirements),
        currentStreak: parseInt(status.monthlyStreak) || 0,
        required: 30,
        reward: QUEST_REWARDS[QUEST_TYPES.MONTHLY_STREAK]
      }
    };
  } catch (error) {
    console.error('Error checking quest status from contract:', error);
    return null;
  }
}
