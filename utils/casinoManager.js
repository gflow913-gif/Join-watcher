const fs = require('fs');
const path = require('path');

const CASINO_DATA_FILE = path.join(__dirname, '..', 'casino_data.json');
const CASINO_CONFIG_FILE = path.join(__dirname, '..', 'casino_config.json');

let casinoData = {
  users: {},
  leaderboard: []
};

let casinoConfig = {
  minBet: 100,
  maxBet: 10000,
  diceWinThreshold: 50,
  diceMultiplier: 1.8,
  coinFlipMultiplier: 1.9,
  slotMultipliers: {
    triple: 15,
    double: 3
  },
  dailyBonus: 500,
  bonusCooldown: 86400000
};

function loadCasinoData() {
  try {
    if (fs.existsSync(CASINO_DATA_FILE)) {
      const data = fs.readFileSync(CASINO_DATA_FILE, 'utf8');
      Object.assign(casinoData, JSON.parse(data));
      console.log('✅ Casino data loaded');
    }
  } catch (error) {
    console.error('❌ Error loading casino data:', error);
  }
}

function saveCasinoData() {
  try {
    fs.writeFileSync(CASINO_DATA_FILE, JSON.stringify(casinoData, null, 2));
  } catch (error) {
    console.error('❌ Error saving casino data:', error);
  }
}

function loadCasinoConfig() {
  try {
    if (fs.existsSync(CASINO_CONFIG_FILE)) {
      const data = fs.readFileSync(CASINO_CONFIG_FILE, 'utf8');
      Object.assign(casinoConfig, JSON.parse(data));
      console.log('✅ Casino config loaded');
    } else {
      saveCasinoConfig();
      console.log('✅ Default casino config created');
    }
  } catch (error) {
    console.error('❌ Error loading casino config:', error);
  }
}

function saveCasinoConfig() {
  try {
    fs.writeFileSync(CASINO_CONFIG_FILE, JSON.stringify(casinoConfig, null, 2));
  } catch (error) {
    console.error('❌ Error saving casino config:', error);
  }
}

function getUserBalance(userId) {
  if (!casinoData.users[userId]) {
    casinoData.users[userId] = {
      balance: 1000, // Starting balance
      totalWon: 0,
      totalLost: 0,
      gamesPlayed: 0,
      lastBonus: 0
    };
    saveCasinoData();
  }
  return casinoData.users[userId];
}

function updateBalance(userId, amount, isWin = true) {
  const user = getUserBalance(userId);
  user.balance += amount;
  user.gamesPlayed++;

  if (isWin && amount > 0) {
    user.totalWon += amount;
  } else if (!isWin && amount < 0) {
    user.totalLost += Math.abs(amount);
  }

  saveCasinoData();
  updateLeaderboard();
}

function updateLeaderboard() {
  casinoData.leaderboard = Object.entries(casinoData.users)
    .map(([userId, data]) => ({
      userId,
      balance: data.balance,
      totalWon: data.totalWon,
      netProfit: data.totalWon - data.totalLost
    }))
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 10);

  saveCasinoData();
}

function canClaimBonus(userId) {
  const user = getUserBalance(userId);
  const now = Date.now();
  return (now - user.lastBonus) >= casinoConfig.bonusCooldown;
}

function claimBonus(userId) {
  const user = getUserBalance(userId);
  user.balance += casinoConfig.dailyBonus;
  user.lastBonus = Date.now();
  saveCasinoData();
  return casinoConfig.dailyBonus;
}

module.exports = {
  loadCasinoData,
  saveCasinoData,
  loadCasinoConfig,
  saveCasinoConfig,
  getUserBalance,
  updateBalance,
  canClaimBonus,
  claimBonus,
  casinoData,
  casinoConfig
};