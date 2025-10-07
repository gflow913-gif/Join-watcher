
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'member_data.json');

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

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      Object.assign(memberData, JSON.parse(data));
      console.log('Data loaded successfully');
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memberData, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
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
    member.totalOwed += 2;
    memberData.totalEligibleJoins++;
    memberData.totalPaymentDue += 2;
    saveData();
    return { eligible: true, reason: 'New member join', owed: 2 };
  } else {
    saveData();
    return { eligible: false, reason: 'Rejoined (already counted)', owed: 0 };
  }
}

module.exports = { loadData, saveData, checkEligibility, memberData };
