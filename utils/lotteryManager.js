const Database = require('@replit/database');
const db = new Database();

let lotteryData = {
  activeLotteries: {},
  lotteryHistory: [],
  userStats: {}
};

async function loadLotteryData() {
  try {
    const data = await db.get('lotteryData');
    if (data) {
      Object.assign(lotteryData, data);
      console.log('✅ Lottery data loaded from Replit DB');
    }
  } catch (error) {
    console.error('❌ Error loading lottery data:', error);
  }
}

async function saveLotteryData() {
  try {
    await db.set('lotteryData', lotteryData);
  } catch (error) {
    console.error('❌ Error saving lottery data:', error);
  }
}

function createLottery(lotteryId, ticketPrice, ticketCount) {
  lotteryData.activeLotteries[lotteryId] = {
    id: lotteryId,
    ticketPrice: ticketPrice,
    totalTickets: ticketCount,
    participants: {},
    ticketOffers: {},
    createdAt: Date.now(),
    status: 'active',
    winner: null,
    messageId: null
  };
  saveLotteryData();
  return lotteryData.activeLotteries[lotteryId];
}

function getLottery(lotteryId) {
  return lotteryData.activeLotteries[lotteryId];
}

function joinLottery(lotteryId, userId) {
  const lottery = lotteryData.activeLotteries[lotteryId];
  if (!lottery) return { success: false, message: 'Lottery not found' };
  if (lottery.status !== 'active') return { success: false, message: 'Lottery is not active' };
  if (lottery.participants[userId]) return { success: false, message: 'You already have a ticket' };
  if (Object.keys(lottery.participants).length >= lottery.totalTickets) {
    return { success: false, message: 'Lottery is sold out' };
  }

  lottery.participants[userId] = {
    userId: userId,
    joinedAt: Date.now(),
    paid: lottery.ticketPrice
  };
  saveLotteryData();
  return { success: true, message: 'Ticket purchased successfully' };
}

function sellTicket(lotteryId, userId) {
  const lottery = lotteryData.activeLotteries[lotteryId];
  if (!lottery) return { success: false, message: 'Lottery not found' };
  if (!lottery.participants[userId]) return { success: false, message: 'You don\'t have a ticket' };

  delete lottery.participants[userId];
  delete lottery.ticketOffers[userId];
  saveLotteryData();
  return { success: true, message: 'Ticket sold back successfully', refund: lottery.ticketPrice };
}

function createTicketOffer(lotteryId, buyerId, offerPrice) {
  const lottery = lotteryData.activeLotteries[lotteryId];
  if (!lottery) return { success: false, message: 'Lottery not found' };
  if (lottery.participants[buyerId]) return { success: false, message: 'You already have a ticket' };

  lottery.ticketOffers[buyerId] = {
    buyerId: buyerId,
    offerPrice: offerPrice,
    createdAt: Date.now()
  };
  saveLotteryData();
  return { success: true, message: 'Ticket offer created' };
}

function acceptTicketOffer(lotteryId, sellerId, buyerId) {
  const lottery = lotteryData.activeLotteries[lotteryId];
  if (!lottery) return { success: false, message: 'Lottery not found' };
  if (!lottery.participants[sellerId]) return { success: false, message: 'Seller doesn\'t have a ticket' };
  if (!lottery.ticketOffers[buyerId]) return { success: false, message: 'Offer not found' };

  const offer = lottery.ticketOffers[buyerId];
  delete lottery.participants[sellerId];
  lottery.participants[buyerId] = {
    userId: buyerId,
    joinedAt: Date.now(),
    paid: offer.offerPrice
  };
  delete lottery.ticketOffers[buyerId];
  saveLotteryData();
  return { 
    success: true, 
    message: 'Ticket transferred successfully', 
    sellerProfit: offer.offerPrice 
  };
}

function setWinner(lotteryId, winnerId) {
  const lottery = lotteryData.activeLotteries[lotteryId];
  if (!lottery) return { success: false, message: 'Lottery not found' };

  lottery.winner = winnerId;
  lottery.status = 'completed';
  lottery.completedAt = Date.now();

  if (!lotteryData.userStats[winnerId]) {
    lotteryData.userStats[winnerId] = { wins: 0, totalWinnings: 0 };
  }
  lotteryData.userStats[winnerId].wins++;
  lotteryData.userStats[winnerId].totalWinnings += lottery.ticketPrice * lottery.totalTickets;

  lotteryData.lotteryHistory.push({
    ...lottery,
    completedAt: Date.now()
  });

  delete lotteryData.activeLotteries[lotteryId];
  saveLotteryData();
  return { success: true, winner: winnerId };
}

function pickRandomWinner(lotteryId) {
  const lottery = lotteryData.activeLotteries[lotteryId];
  if (!lottery) return { success: false, message: 'Lottery not found' };

  const participants = Object.keys(lottery.participants);
  if (participants.length === 0) return { success: false, message: 'No participants' };

  const winnerId = participants[Math.floor(Math.random() * participants.length)];
  return setWinner(lotteryId, winnerId);
}

module.exports = {
  loadLotteryData,
  saveLotteryData,
  createLottery,
  getLottery,
  joinLottery,
  sellTicket,
  createTicketOffer,
  acceptTicketOffer,
  setWinner,
  pickRandomWinner,
  lotteryData
};