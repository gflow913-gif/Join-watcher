
const fs = require('fs');
const path = require('path');

const DEPOSIT_DATA_FILE = path.join(__dirname, '..', 'deposit_data.json');

let depositData = {
  depositLink: 'https://www.roblox.com/games/YOUR_GAME_ID', // Default link
  deposits: {},
  withdrawals: {},
  activeTickets: {}
};

function loadDepositData() {
  try {
    if (fs.existsSync(DEPOSIT_DATA_FILE)) {
      const data = fs.readFileSync(DEPOSIT_DATA_FILE, 'utf8');
      Object.assign(depositData, JSON.parse(data));
      console.log('✅ Deposit data loaded');
    } else {
      saveDepositData();
      console.log('✅ Default deposit data created');
    }
  } catch (error) {
    console.error('❌ Error loading deposit data:', error);
  }
}

function saveDepositData() {
  try {
    fs.writeFileSync(DEPOSIT_DATA_FILE, JSON.stringify(depositData, null, 2));
  } catch (error) {
    console.error('❌ Error saving deposit data:', error);
  }
}

function setDepositLink(link) {
  depositData.depositLink = link;
  saveDepositData();
}

function createTicket(userId, channelId) {
  depositData.activeTickets[userId] = {
    channelId,
    createdAt: Date.now(),
    status: 'open'
  };
  saveDepositData();
}

function closeTicket(userId) {
  if (depositData.activeTickets[userId]) {
    delete depositData.activeTickets[userId];
    saveDepositData();
    return true;
  }
  return false;
}

function hasActiveTicket(userId) {
  return !!depositData.activeTickets[userId];
}

function getTicketOwner(channelId) {
  return Object.keys(depositData.activeTickets).find(
    userId => depositData.activeTickets[userId].channelId === channelId
  );
}

function recordDeposit(userId, amount, timestamp = Date.now()) {
  if (!depositData.deposits[userId]) {
    depositData.deposits[userId] = [];
  }
  depositData.deposits[userId].push({ amount, timestamp });
  saveDepositData();
}

function recordWithdrawal(userId, amount, timestamp = Date.now()) {
  if (!depositData.withdrawals[userId]) {
    depositData.withdrawals[userId] = [];
  }
  depositData.withdrawals[userId].push({ amount, timestamp });
  saveDepositData();
}

module.exports = {
  loadDepositData,
  saveDepositData,
  setDepositLink,
  createTicket,
  closeTicket,
  hasActiveTicket,
  getTicketOwner,
  recordDeposit,
  recordWithdrawal,
  depositData
};
