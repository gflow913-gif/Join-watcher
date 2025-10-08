
const { EmbedBuilder } = require('discord.js');
const { setDepositLink, depositData } = require('../utils/depositManager');

const OWNER_ID = '1309720025912971355';

function getAuthorizedRoles(ticketType = 'GENERAL') {
  const roles = process.env[`${ticketType.toUpperCase()}_ROLES`] || '';
  return roles.split(',').filter(r => r.trim());
}

async function handleDepositCommands(interaction) {
  const userId = interaction.user.id;
  const member = interaction.member;

  const isOwner = userId === OWNER_ID;
  const depositRoles = getAuthorizedRoles('DEPOSIT');
  const withdrawRoles = getAuthorizedRoles('WITHDRAW');
  const gamblingRoles = getAuthorizedRoles('GAMBLING');
  const generalRoles = getAuthorizedRoles('GENERAL');
  
  const allAuthorizedRoles = [...new Set([...depositRoles, ...withdrawRoles, ...gamblingRoles, ...generalRoles])];
  const hasRole = allAuthorizedRoles.some(roleId => member.roles.cache.has(roleId));
  const isAuthorized = isOwner || hasRole;

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
      return `• <@${userId}> - <#${data.channelId}> [${data.ticketType}] (Created: <t:${Math.floor(data.createdAt / 1000)}:R>)`;
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
