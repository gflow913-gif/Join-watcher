
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function handleLotteryButtons(interaction) {
  // Lottery button handling will be implemented here
  // For now, return false to allow other button handlers
  return false;
}

module.exports = { handleLotteryButtons };

const { getLottery, joinLottery, sellTicket, createTicketOffer, acceptTicketOffer } = require('../utils/lotteryManager');
const { getUserBalance, updateBalance } = require('../utils/casinoManager');

async function handleLotteryButtons(interaction) {
  const customId = interaction.customId;
  
  if (!customId.startsWith('lottery_')) return false;

  const [action, type, lotteryId] = customId.split('_');
  const lottery = getLottery(lotteryId);
  const userId = interaction.user.id;

  if (!lottery) {
    await interaction.reply({
      content: '❌ Lottery not found!',
      ephemeral: true
    });
    return true;
  }

  // ===== JOIN LOTTERY BUTTON =====
  if (type === 'join') {
    const userData = getUserBalance(userId);
    
    if (userData.balance < lottery.ticketPrice) {
      await interaction.reply({
        content: `❌ Insufficient balance! You need ${lottery.ticketPrice} sx but have ${userData.balance} sx.`,
        ephemeral: true
      });
      return true;
    }

    const result = joinLottery(lotteryId, userId);
    if (!result.success) {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
      return true;
    }

    updateBalance(userId, -lottery.ticketPrice, false);

    const updatedLottery = getLottery(lotteryId);
    const ticketsSold = Object.keys(updatedLottery.participants).length;

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎟️ NEW LOTTERY STARTED!')
      .setDescription(`A new lottery has been created!`)
      .addFields(
        { name: '💰 Ticket Price', value: `${lottery.ticketPrice} coins`, inline: true },
        { name: '🎫 Total Tickets', value: `${lottery.totalTickets}`, inline: true },
        { name: '🎫 Tickets Sold', value: `${ticketsSold}/${lottery.totalTickets}`, inline: true },
        { name: '💵 Prize Pool', value: `${lottery.ticketPrice * lottery.totalTickets} coins`, inline: true },
        { name: '📊 Status', value: ticketsSold >= lottery.totalTickets ? '🔴 Sold Out' : '🟢 Active', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Lottery ID: ${lotteryId}` });

    await interaction.update({ embeds: [embed] });
    
    await interaction.followUp({
      content: `✅ You purchased a lottery ticket for ${lottery.ticketPrice} sx!`,
      ephemeral: true
    });
    return true;
  }

  // ===== SELL TICKET BUTTON =====
  if (type === 'sell') {
    const result = sellTicket(lotteryId, userId);
    if (!result.success) {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
      return true;
    }

    updateBalance(userId, result.refund, true);

    const updatedLottery = getLottery(lotteryId);
    const ticketsSold = Object.keys(updatedLottery.participants).length;

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎟️ NEW LOTTERY STARTED!')
      .setDescription(`A new lottery has been created!`)
      .addFields(
        { name: '💰 Ticket Price', value: `${lottery.ticketPrice} coins`, inline: true },
        { name: '🎫 Total Tickets', value: `${lottery.totalTickets}`, inline: true },
        { name: '🎫 Tickets Sold', value: `${ticketsSold}/${lottery.totalTickets}`, inline: true },
        { name: '💵 Prize Pool', value: `${lottery.ticketPrice * lottery.totalTickets} coins`, inline: true },
        { name: '📊 Status', value: ticketsSold >= lottery.totalTickets ? '🔴 Sold Out' : '🟢 Active', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Lottery ID: ${lotteryId}` });

    await interaction.update({ embeds: [embed] });

    await interaction.followUp({
      content: `✅ Ticket sold back! You received ${result.refund} coins.`,
      ephemeral: true
    });
    return true;
  }

  // ===== BUY TICKET OFFER BUTTON =====
  if (type === 'offer') {
    const ticketsSold = Object.keys(lottery.participants).length;
    
    if (ticketsSold < lottery.totalTickets) {
      await interaction.reply({
        content: '❌ Lottery is not sold out yet! Use "Join Lottery" button to buy a ticket.',
        ephemeral: true
      });
      return true;
    }

    const offerPrice = Math.floor(lottery.ticketPrice * 1.2);
    const userData = getUserBalance(userId);

    if (userData.balance < offerPrice) {
      await interaction.reply({
        content: `❌ Insufficient balance! You need ${offerPrice} sx to make an offer.`,
        ephemeral: true
      });
      return true;
    }

    const result = createTicketOffer(lotteryId, userId, offerPrice);
    if (!result.success) {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
      return true;
    }

    const participants = Object.keys(lottery.participants);
    const buttons = participants.map(participantId => 
      new ButtonBuilder()
        .setCustomId(`lottery_accept_${lotteryId}_${participantId}_${userId}`)
        .setLabel(`Sell to ${interaction.user.username}`)
        .setStyle(ButtonStyle.Success)
    );

    const row = new ActionRowBuilder().addComponents(buttons.slice(0, 5));

    await interaction.reply({
      content: `💰 You offered ${offerPrice} sx for a ticket. Current ticket holders can accept your offer below.`,
      components: buttons.length > 0 ? [row] : [],
      ephemeral: false
    });
    return true;
  }

  // ===== ACCEPT TICKET OFFER BUTTON =====
  if (type === 'accept') {
    const [, , lotteryId, sellerId, buyerId] = customId.split('_');
    
    if (userId !== sellerId) {
      await interaction.reply({
        content: '❌ This button is not for you!',
        ephemeral: true
      });
      return true;
    }

    const result = acceptTicketOffer(lotteryId, sellerId, buyerId);
    if (!result.success) {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
      return true;
    }

    const buyerData = getUserBalance(buyerId);
    const offer = lottery.ticketOffers[buyerId];
    
    updateBalance(buyerId, -offer.offerPrice, false);
    updateBalance(sellerId, result.sellerProfit, true);

    await interaction.update({
      content: `✅ Ticket transferred! <@${buyerId}> bought the ticket from <@${sellerId}> for ${result.sellerProfit} coins.`,
      components: []
    });
    return true;
  }

  return false;
}

module.exports = { handleLotteryButtons };
