
const { EmbedBuilder } = require('discord.js');
const { setDepositLink, depositData } = require('../utils/depositManager');

const OWNER_ID = '1309720025912971355';
const AUTHORIZED_ROLE_ID = 'YOUR_AUTHORIZED_ROLE_ID'; // Configure this

async function handleDepositCommands(interaction) {
  const userId = interaction.user.id;
  const member = interaction.member;

  // Check authorization
  const isOwner = userId === OWNER_ID;
  const hasRole = member.roles.cache.has(AUTHORIZED_ROLE_ID);
  const isAuthorized = isOwner || hasRole;

  // === SET DEPOSIT LINK COMMAND (Owner Only) ===
  if (interaction.commandName === 'setdepositlink') {
    if (!isOwner) {
      await interaction.reply({
        content: '🚫 Only the bot owner can set the deposit link.',
        ephemeral: true
      });
      return true;
    }

    const link = interaction.options.getString('link');
    setDepositLink(link);

    await interaction.reply({
      content: `✅ Deposit link updated to:\n${link}`,
      ephemeral: true
    });
    return true;
  }

  // === DEPOSIT COMMAND ===
  if (interaction.commandName === 'deposit') {
    if (!isAuthorized) {
      await interaction.reply({
        content: '🚫 You do not have permission to use this command.',
        ephemeral: true
      });
      return true;
    }

    const user = interaction.options.getUser('user');
    
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('💰 Deposit Instructions')
      .setDescription(`${user ? `<@${user.id}>` : 'User'}, please follow these steps to deposit:`)
      .addFields(
        { name: '1️⃣ Join the Game', value: `[Click here to join](${depositData.depositLink})` },
        { name: '2️⃣ Make Your Deposit', value: 'Follow the in-game instructions to complete your deposit.' },
        { name: '3️⃣ Wait for Confirmation', value: 'Staff will verify your deposit shortly.' }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return true;
  }

  // === VIEW ACTIVE TICKETS COMMAND ===
  if (interaction.commandName === 'viewtickets') {
    if (!isAuthorized) {
      await interaction.reply({
        content: '🚫 You do not have permission to use this command.',
        ephemeral: true
      });
      return true;
    }

    const activeTickets = Object.entries(depositData.activeTickets);
    
    if (activeTickets.length === 0) {
      await interaction.reply({
        content: '📋 No active tickets at the moment.',
        ephemeral: true
      });
      return true;
    }

    const ticketList = activeTickets.map(([userId, data]) => {
      return `• <@${userId}> - <#${data.channelId}> (Created: <t:${Math.floor(data.createdAt / 1000)}:R>)`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('📋 Active Tickets')
      .setDescription(ticketList)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return true;
  }

  return false;
}

module.exports = { handleDepositCommands };
