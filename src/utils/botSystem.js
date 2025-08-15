// Bot System for Multi-Player Mode
export const botPlayers = [
  {
    id: "bot1",
    name: "🤖 AlphaBot",
    personality: "aggressive",
    responseTime: { min: 2000, max: 5000 },
    betStrategy: "high_risk",
    winRate: 0.65,
    avatar: "🤖",
    color: "#ff4444"
  },
  {
    id: "bot2", 
    name: "🤖 SafeBot",
    personality: "conservative",
    responseTime: { min: 3000, max: 8000 },
    betStrategy: "low_risk",
    winRate: 0.45,
    avatar: "🤖",
    color: "#16f06c"
  },
  {
    id: "bot3",
    name: "🤖 LuckyBot", 
    personality: "random",
    responseTime: { min: 1000, max: 6000 },
    betStrategy: "random",
    winRate: 0.55,
    avatar: "🤖",
    color: "#ffaa00"
  },
  {
    id: "bot4",
    name: "🤖 ProBot",
    personality: "smart",
    responseTime: { min: 1500, max: 4000 },
    betStrategy: "adaptive",
    winRate: 0.75,
    avatar: "🤖",
    color: "#9c27b0"
  }
];

export const botMessages = {
  aggressive: [
    "Let's go big! 🔥",
    "I'm feeling lucky today! 🍀",
    "Time to dominate! 💪",
    "Watch me win! 🎯",
    "This is my game! 🏆"
  ],
  conservative: [
    "Let's play it safe... 🤔",
    "I'll start small 💰",
    "Patience is key ⏰",
    "Slow and steady 🐢",
    "Better safe than sorry 🛡️"
  ],
  random: [
    "Heads or tails? 🪙",
    "I love this game! 🎮",
    "Good luck everyone! 🍀",
    "Let's flip! 🎲",
    "This is fun! 😄"
  ],
  smart: [
    "Analyzing patterns... 🧠",
    "I see the trend! 📈",
    "Calculating odds... ⚖️",
    "My strategy is perfect! 🎯",
    "I'm unstoppable! 🚀"
  ]
};

export const botDifficulties = {
  easy: {
    winRate: 0.3,
    responseTime: { min: 4000, max: 8000 },
    strategy: "predictable",
    multiplier: 0.8
  },
  medium: {
    winRate: 0.5,
    responseTime: { min: 2000, max: 5000 },
    strategy: "balanced",
    multiplier: 1.0
  },
  hard: {
    winRate: 0.7,
    responseTime: { min: 1000, max: 3000 },
    strategy: "smart",
    multiplier: 1.2
  }
};

// Simulate bot behavior
export const simulateBotBehavior = (bot, room, gameHistory = []) => {
  const delay = Math.random() * (bot.responseTime.max - bot.responseTime.min) + bot.responseTime.min;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const choice = getBotChoice(bot, gameHistory);
      const amount = getBotBetAmount(bot, room.betAmount);
      const message = getBotMessage(bot);
      
      resolve({
        choice,
        amount,
        message,
        botId: bot.id,
        botName: bot.name
      });
    }, delay);
  });
};

// Get bot choice based on personality and history
const getBotChoice = (bot, gameHistory) => {
  const recentResults = gameHistory.slice(-5);
  
  switch (bot.personality) {
    case "aggressive":
      // Aggressive bots tend to stick with their choice
      return Math.random() > 0.6 ? "heads" : "tails";
    
    case "conservative":
      // Conservative bots follow the trend
      if (recentResults.length > 0) {
        const lastResult = recentResults[recentResults.length - 1];
        return lastResult === "heads" ? "tails" : "heads";
      }
      return Math.random() > 0.5 ? "heads" : "tails";
    
    case "smart":
      // Smart bots analyze patterns
      const headsCount = recentResults.filter(r => r === "heads").length;
      const tailsCount = recentResults.filter(r => r === "tails").length;
      
      if (headsCount > tailsCount) {
        return "tails";
      } else if (tailsCount > headsCount) {
        return "heads";
      } else {
        return Math.random() > 0.5 ? "heads" : "tails";
      }
    
    case "random":
    default:
      // Random bots just pick randomly
      return Math.random() > 0.5 ? "heads" : "tails";
  }
};

// Get bot bet amount based on strategy
const getBotBetAmount = (bot, baseAmount) => {
  switch (bot.betStrategy) {
    case "high_risk":
      return baseAmount * (1.5 + Math.random() * 0.5); // 1.5x to 2x
    
    case "low_risk":
      return baseAmount * (0.8 + Math.random() * 0.2); // 0.8x to 1x
    
    case "adaptive":
      return baseAmount * (0.9 + Math.random() * 0.6); // 0.9x to 1.5x
    
    case "random":
    default:
      return baseAmount * (0.5 + Math.random() * 1.5); // 0.5x to 2x
  }
};

// Get random bot message
const getBotMessage = (bot) => {
  const messages = botMessages[bot.personality];
  return messages[Math.floor(Math.random() * messages.length)];
};

// Create bot players for a room
export const createBotPlayers = (count = 2, difficulty = "medium") => {
  const shuffledBots = [...botPlayers].sort(() => Math.random() - 0.5);
  const selectedBots = shuffledBots.slice(0, count);
  
  return selectedBots.map(bot => ({
    ...bot,
    difficulty,
    stats: {
      wins: Math.floor(Math.random() * 20),
      losses: Math.floor(Math.random() * 15),
      totalGames: 0
    }
  }));
};

// Update bot statistics
export const updateBotStats = (botId, won) => {
  // In a real implementation, this would update bot statistics
  console.log(`Bot ${botId} ${won ? 'won' : 'lost'} the game`);
};

// Get bot win probability based on difficulty
export const getBotWinProbability = (bot, difficulty) => {
  const difficultyMultiplier = botDifficulties[difficulty].multiplier;
  return Math.min(0.9, bot.winRate * difficultyMultiplier);
}; 