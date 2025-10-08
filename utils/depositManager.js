
const Database = require('@replit/database');
const db = new Database();

let depositData = {
  depositLink: 'https://www.roblox.com/games/YOUR_GAME_ID',
  deposits: {},
  withdrawals: {},
  activeTickets: {},
  ticketCategories: {}
};

async function loadDepositData() {
  try {
    const data = await db.get('depositData');
    if (data) {
      Object.assign(depositData, data);
      console.log('✅ Deposit data loaded from Replit DB');
    } else {
      await saveDepositData();
      console.log('✅ Default deposit data created in Replit DB');
    }
  } catch (error) {
    console.error('❌ Error loading deposit data:', error);
  }
}

async function saveDepositData() {
  try {
    await db.set('depositData', depositData);
  } catch (error) {
    console.error('❌ Error saving deposit data:', error);
  }
}

async function setDepositLink(link) {
  depositData.depositLink = link;
  await saveDepositData();
}

async function createTicket(userId, channelId, ticketType, categoryId) {
  depositData.activeTickets[userId] = {
    channelId,
    ticketType,
    categoryId,
    createdAt: Date.now(),
    status: 'open'
  };
  await saveDepositData();
}

async function closeTicket(userId) {
  if (depositData.activeTickets[userId]) {
    delete depositData.activeTickets[userId];
    await saveDepositData();
    return true;
  }
  return false;
}

function hasActiveTicket(userId, ticketType = null) {
  if (!depositData.activeTickets[userId]) return false;
  if (ticketType) {
    return depositData.activeTickets[userId].ticketType === ticketType;
  }
  return true;
}

function getTicketOwner(channelId) {
  return Object.keys(depositData.activeTickets).find(
    userId => depositData.activeTickets[userId].channelId === channelId
  );
}

function getTicketCategory(channelId) {
  const userId = getTicketOwner(channelId);
  if (userId && depositData.activeTickets[userId]) {
    return depositData.activeTickets[userId].categoryId;
  }
  return null;
}

function getTicketType(channelId) {
  const userId = getTicketOwner(channelId);
  if (userId && depositData.activeTickets[userId]) {
    return depositData.activeTickets[userId].ticketType;
  }
  return null;
}

async function recordDeposit(userId, amount, timestamp = Date.now()) {
  if (!depositData.deposits[userId]) {
    depositData.deposits[userId] = [];
  }
  depositData.deposits[userId].push({ amount, timestamp });
  await saveDepositData();
}

async function recordWithdrawal(userId, amount, timestamp = Date.now()) {
  if (!depositData.withdrawals[userId]) {
    depositData.withdrawals[userId] = [];
  }
  depositData.withdrawals[userId].push({ amount, timestamp });
  await saveDepositData();
}

module.exports = {
  loadDepositData,
  saveDepositData,
  setDepositLink,
  createTicket,
  closeTicket,
  hasActiveTicket,
  getTicketOwner,
  getTicketCategory,
  getTicketType,
  recordDeposit,
  recordWithdrawal,
  depositData
};
