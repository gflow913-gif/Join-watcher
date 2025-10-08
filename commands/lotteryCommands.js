
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createLottery, getLottery, pickRandomWinner, setWinner, lotteryData } = require('../utils/lotteryManager');

const LOTTERY_CHANNEL_ID = '1419177241094524928';

async function handleLotteryCommands(interaction) {
  const ownerId = '1309720025912971355';
  const userId = interaction.user.id;

  // ===== CREATE LOTTERY COMMAND =====
  if (interaction.commandName === 'createlottery') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 Only the bot owner can create lotteries.',
        ephemeral: true
      });
      return true;
    }

    const ticketPrice = interaction.options.getInteger('ticketprice');
    const ticketCount = interaction.options.getInteger('ticketcount');

    const lotteryId = `lottery_${Date.now()}`;
    const lottery = createLottery(lotteryId, ticketPrice, ticketCount);

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎟️ NEW LOTTERY STARTED!')
      .setDescription(`A new lottery has been created!`)
      .addFields(
        { name: '💰 Ticket Price', value: `${ticketPrice} coins`, inline: true },
        { name: '🎫 Total Tickets', value: `${ticketCount}`, inline: true },
        { name: '🎫 Tickets Sold', value: `0/${ticketCount}`, inline: true },
        { name: '💵 Prize Pool', value: `${ticketPrice * ticketCount} coins`, inline: true },
        { name: '📊 Status', value: '🟢 Active', inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Lottery ID: ${lotteryId}` });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`lottery_join_${lotteryId}`)
          .setLabel('🎫 Join Lottery')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`lottery_sell_${lotteryId}`)
          .setLabel('💸 Sell Ticket')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`lottery_offer_${lotteryId}`)
          .setLabel('💰 Buy Ticket Offer')
          .setStyle(ButtonStyle.Primary)
      );

    const channel = await interaction.client.channels.fetch(LOTTERY_CHANNEL_ID);
    const message = await channel.send({ embeds: [embed], components: [row] });
    
    lottery.messageId = message.id;
    require('../utils/lotteryManager').saveLotteryData();

    await interaction.reply({
      content: `✅ Lottery created successfully in <#${LOTTERY_CHANNEL_ID}>!`,
      ephemeral: true
    });
    return true;
  }

  // ===== CONFIG LOTTERY COMMAND =====
  if (interaction.commandName === 'configlottery') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 Only the bot owner can configure lotteries.',
        ephemeral: true
      });
      return true;
    }

    const lotteryId = interaction.options.getString('lotteryid');
    const winnerId = interaction.options.getUser('winner').id;

    const lottery = getLottery(lotteryId);
    if (!lottery) {
      await interaction.reply({
        content: '❌ Lottery not found!',
        ephemeral: true
      });
      return true;
    }

    if (!lottery.participants[winnerId]) {
      await interaction.reply({
        content: '❌ That user is not a participant in this lottery!',
        ephemeral: true
      });
      return true;
    }

    const result = setWinner(lotteryId, winnerId);
    
    const channel = await interaction.client.channels.fetch(LOTTERY_CHANNEL_ID);
    const message = await channel.messages.fetch(lottery.messageId);

    const winnerUser = await interaction.client.users.fetch(winnerId);
    const prizePool = lottery.ticketPrice * lottery.totalTickets;

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎉 LOTTERY RESULT - WINNER ANNOUNCED!')
      .setDescription(`The lottery has ended!`)
      .addFields(
        { name: '🏆 Winner', value: `<@${winnerId}>`, inline: true },
        { name: '💰 Prize Pool', value: `${prizePool} coins`, inline: true },
        { name: '🎫 Total Participants', value: `${Object.keys(lottery.participants).length}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Lottery ID: ${lotteryId}` });

    await message.edit({ embeds: [embed], components: [] });

    await interaction.reply({
      content: `✅ Winner configured: <@${winnerId}> won ${prizePool} coins!`,
      ephemeral: true
    });
    return true;
  }

  // ===== END LOTTERY COMMAND =====
  if (interaction.commandName === 'endlottery') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 Only the bot owner can end lotteries.',
        ephemeral: true
      });
      return true;
    }

    const lotteryId = interaction.options.getString('lotteryid');
    const lottery = getLottery(lotteryId);
    
    if (!lottery) {
      await interaction.reply({
        content: '❌ Lottery not found!',
        ephemeral: true
      });
      return true;
    }

    const result = pickRandomWinner(lotteryId);
    if (!result.success) {
      await interaction.reply({
        content: `❌ ${result.message}`,
        ephemeral: true
      });
      return true;
    }

    const channel = await interaction.client.channels.fetch(LOTTERY_CHANNEL_ID);
    const message = await channel.messages.fetch(lottery.messageId);

    const prizePool = lottery.ticketPrice * lottery.totalTickets;

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎉 LOTTERY RESULT - WINNER ANNOUNCED!')
      .setDescription(`The lottery has ended!`)
      .addFields(
        { name: '🏆 Winner', value: `<@${result.winner}>`, inline: true },
        { name: '💰 Prize Pool', value: `${prizePool} coins`, inline: true },
        { name: '🎫 Total Participants', value: `${Object.keys(lottery.participants).length}`, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Lottery ID: ${lotteryId}` });

    await message.edit({ embeds: [embed], components: [] });

    await interaction.reply({
      content: `✅ Lottery ended! Winner: <@${result.winner}> won ${prizePool} coins!`,
      ephemeral: true
    });
    return true;
  }

  return false;
}

module.exports = { handleLotteryCommands };
