
const Database = require('@replit/database');
const db = new Database();
const { config } = require('./config');

let memberData = {
  members: {},
  totalEligibleJoins: 0,
  totalPaymentDue: 0,
  ticketConfig: {
    channelId: null,
    namePrefix: 'ticket',
    ticketCounter: 0,
    categoryId: null
  },
  activeTickets: {},
  invites: {},
  inviteTracker: {}
};

async function loadData() {
  try {
    const data = await db.get('memberData');
    if (data) {
      Object.assign(memberData, data);
      console.log('✅ Data loaded successfully from Replit DB');
    } else {
      console.log('📝 No existing data found, using defaults');
    }
  } catch (error) {
    console.error('❌ Error loading data:', error);
  }
}

async function saveData() {
  try {
    await db.set('memberData', memberData);
  } catch (error) {
    console.error('❌ Error saving data:', error);
  }
}

function checkEligibility(userId, isNewMember) {
  if (!memberData.members[userId]) {
    memberData.members[userId] = {
      userId: userId,
      firstJoin: new Date().toISOString(),
      joins: [],
      eligibleJoins: 0,
      totalOwed: 0
    };
  }

  const member = memberData.members[userId];
  const now = new Date().toISOString();
  
  member.joins.push({
    timestamp: now,
    isNewMember: isNewMember,
    claimed: false
  });

  if (isNewMember) {
    member.eligibleJoins++;
    member.totalOwed += config.paymentPerJoin;
    memberData.totalEligibleJoins++;
    memberData.totalPaymentDue += config.paymentPerJoin;
    saveData();
    return { eligible: true, reason: 'New member join', owed: config.paymentPerJoin };
  } else {
    saveData();
    return { eligible: false, reason: 'Rejoined (already counted)', owed: 0 };
  }
}

module.exports = { loadData, saveData, checkEligibility, memberData };
