const Database = require('@replit/database');
const db = new Database();

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

async function loadCasinoData() {
  try {
    const data = await db.get('casinoData');
    if (data) {
      Object.assign(casinoData, data);
      console.log('✅ Casino data loaded from Replit DB');
    }
  } catch (error) {
    console.error('❌ Error loading casino data:', error);
  }
}

async function saveCasinoData() {
  try {
    await db.set('casinoData', casinoData);
  } catch (error) {
    console.error('❌ Error saving casino data:', error);
  }
}

async function loadCasinoConfig() {
  try {
    const data = await db.get('casinoConfig');
    if (data) {
      Object.assign(casinoConfig, data);
      console.log('✅ Casino config loaded from Replit DB');
    } else {
      await saveCasinoConfig();
      console.log('✅ Default casino config created in Replit DB');
    }
  } catch (error) {
    console.error('❌ Error loading casino config:', error);
  }
}

async function saveCasinoConfig() {
  try {
    await db.set('casinoConfig', casinoConfig);
  } catch (error) {
    console.error('❌ Error saving casino config:', error);
  }
}

function getUserData(userId) {
  if (!casinoData.users[userId]) {
    casinoData.users[userId] = {
      balance: 1000, // Starting balance
      totalWon: 0,
      totalLost: 0,
      gamesPlayed: 0,
      lastBonus: 0
    };
  }
  return casinoData.users[userId];
}

function updateBalance(userId, amount, isWin = true) {
  const user = getUserData(userId);
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
  const user = getUserData(userId);
  const now = Date.now();
  return (now - user.lastBonus) >= casinoConfig.bonusCooldown;
}

function claimBonus(userId) {
  const user = getUserData(userId);
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
  getUserData,
  updateBalance,
  canClaimBonus,
  claimBonus,
  casinoData,
  casinoConfig
};