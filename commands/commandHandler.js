
const { memberData, saveData } = require('../utils/dataManager');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function handleCommands(interaction, client) {
  if (interaction.commandName === 'checkuser') {
    const user = interaction.options.getUser('user');
    const userData = memberData.members[user.id];

    if (!userData) {
      await interaction.reply({
        content: `No data found for ${user.tag}. They haven't joined the server yet or weren't tracked.`,
        ephemeral: true
      });
      return;
    }

    await interaction.reply({
      content: `**User Information: ${user.tag}**\n` +
        `First Join: ${new Date(userData.firstJoin).toLocaleString()}\n` +
        `Total Joins: ${userData.joins.length}\n` +
        `Eligible Joins: ${userData.eligibleJoins}\n` +
        `Total Owed: ${userData.totalOwed}sx\n\n` +
        `**Join History:**\n` +
        userData.joins.map((join, i) => 
          `${i + 1}. ${new Date(join.timestamp).toLocaleString()} - ${join.isNewMember ? 'NEW ✅' : 'REJOIN ❌'}`
        ).join('\n'),
      ephemeral: true
    });
  }

  if (interaction.commandName === 'stats') {
    const totalMembers = Object.keys(memberData.members).length;
    
    await interaction.reply({
      content: `**Server Statistics**\n` +
        `Total Tracked Members: ${totalMembers}\n` +
        `Total Eligible Joins: ${memberData.totalEligibleJoins}\n` +
        `Total Payment Due: ${memberData.totalPaymentDue}sx\n` +
        `Rate: 2sx per eligible join`,
      ephemeral: true
    });
  }

  if (interaction.commandName === 'scanexisting') {
    if (!interaction.member.permissions.has('Administrator')) {
      await interaction.reply({
        content: 'You need Administrator permission to use this command.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const members = await interaction.guild.members.fetch();
      let newlyTracked = 0;
      let alreadyTracked = 0;

      members.forEach(member => {
        if (member.user.bot) return;

        if (!memberData.members[member.user.id]) {
          memberData.members[member.user.id] = {
            userId: member.user.id,
            firstJoin: member.joinedAt?.toISOString() || new Date().toISOString(),
            joins: [{
              timestamp: member.joinedAt?.toISOString() || new Date().toISOString(),
              isNewMember: false,
              claimed: true,
              note: 'Pre-existing member (scanned, not eligible for payment)'
            }],
            eligibleJoins: 0,
            totalOwed: 0,
            isScanned: true
          };
          newlyTracked++;
        } else {
          alreadyTracked++;
        }
      });

      saveData();

      await interaction.editReply({
        content: `**Scan Complete**\n` +
          `Total members scanned: ${members.size}\n` +
          `Newly tracked: ${newlyTracked}\n` +
          `Already tracked: ${alreadyTracked}\n` +
          `Total eligible joins: ${memberData.totalEligibleJoins}\n` +
          `Total payment due: ${memberData.totalPaymentDue}sx`
      });
    } catch (error) {
      console.error('Error scanning members:', error);
      await interaction.editReply({
        content: `Error scanning members: ${error.message}`
      });
    }
  }

  if (interaction.commandName === 'unclaimed') {
    if (interaction.user.id !== '1309720025912971355') {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
      return;
    }

    const unclaimedJoins = [];
    
    for (const [userId, userData] of Object.entries(memberData.members)) {
      userData.joins.forEach((join, index) => {
        if (join.isNewMember && !join.claimed) {
          unclaimedJoins.push({
            userId: userId,
            timestamp: join.timestamp,
            joinIndex: index
          });
        }
      });
    }

    if (unclaimedJoins.length === 0) {
      await interaction.reply({
        content: '**No Unclaimed Joins**\nAll eligible joins have been claimed!',
        ephemeral: true
      });
      return;
    }

    const totalUnclaimed = unclaimedJoins.length;
    const totalUnclaimedPayment = totalUnclaimed * 2;

    let message = `**Unclaimed Eligible Joins**\n`;
    message += `Total Unclaimed: ${totalUnclaimed}\n`;
    message += `Total Payment Due: ${totalUnclaimedPayment}sx\n\n`;

    const displayLimit = 20;
    const displayJoins = unclaimedJoins.slice(0, displayLimit);

    for (const join of displayJoins) {
      const user = await client.users.fetch(join.userId).catch(() => null);
      const userName = user ? user.tag : `User ID: ${join.userId}`;
      message += `• ${userName} - ${new Date(join.timestamp).toLocaleString()} - 2sx\n`;
    }

    if (unclaimedJoins.length > displayLimit) {
      message += `\n...and ${unclaimedJoins.length - displayLimit} more`;
    }

    await interaction.reply({
      content: message,
      ephemeral: true
    });
  }

  if (interaction.commandName === 'claim') {
    if (interaction.user.id !== '1309720025912971355') {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
      return;
    }

    let claimedCount = 0;
    let claimedAmount = 0;

    for (const [userId, userData] of Object.entries(memberData.members)) {
      userData.joins.forEach((join) => {
        if (join.isNewMember && !join.claimed) {
          join.claimed = true;
          claimedCount++;
          claimedAmount += 2;
        }
      });
    }

    if (claimedCount === 0) {
      await interaction.reply({
        content: '**No Unclaimed Joins**\nThere are no eligible joins to claim.',
        ephemeral: true
      });
      return;
    }

    saveData();

    await interaction.reply({
      content: `**Joins Claimed Successfully!**\n` +
        `Claimed Joins: ${claimedCount}\n` +
        `Total Amount Claimed: ${claimedAmount}sx\n\n` +
        `All eligible joins have been marked as claimed.`,
      ephemeral: true
    });
  }

  if (interaction.commandName === 'setupticket') {
    if (interaction.user.id !== '1309720025912971355') {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
      return;
    }

    const channel = interaction.options.getChannel('channel');
    const namePrefix = interaction.options.getString('nameprefix');
    const category = interaction.options.getChannel('category');

    if (category && category.type !== 4) {
      await interaction.reply({
        content: '❌ The category must be a category channel, not a text/voice channel!',
        ephemeral: true
      });
      return;
    }

    if (!memberData.ticketConfig) {
      memberData.ticketConfig = {
        channelId: null,
        namePrefix: 'ticket',
        ticketCounter: 0,
        categoryId: null
      };
    }

    memberData.ticketConfig.channelId = channel.id;
    memberData.ticketConfig.namePrefix = namePrefix;
    memberData.ticketConfig.categoryId = category?.id || null;

    saveData();

    const embed = new EmbedBuilder()
      .setTitle('Claim Panel')
      .setDescription('To create a ticket use the **Create Ticket** button below.')
      .setColor(0x5865F2);

    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('📧 Create Ticket')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder()
      .addComponents(button);

    try {
      await channel.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({
        content: `✅ Ticket system set up successfully!\n` +
          `Channel: <#${channel.id}>\n` +
          `Ticket Name: ${namePrefix}-1, ${namePrefix}-2, etc.\n` +
          `Category: ${category ? `<#${category.id}>` : 'None (tickets in server root)'}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error setting up ticket system:', error);
      await interaction.reply({
        content: `Error setting up ticket system: ${error.message}`,
        ephemeral: true
      });
    }
  }

  if (interaction.commandName === 'createroles') {
    if (interaction.user.id !== '1309720025912971355') {
      await interaction.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild;
      
      // Get @everyone role permissions (member permissions)
      const everyoneRole = guild.roles.everyone;
      const memberPermissions = everyoneRole.permissions;

      // Create Big Funder role (Red-ish RGB)
      const bigFunder = await guild.roles.create({
        name: 'Big Funder',
        color: 0xFF0000, // Red
        permissions: memberPermissions,
        reason: 'Created by bot command'
      });

      // Create Middle Funder role (Green-ish RGB)
      const middleFunder = await guild.roles.create({
        name: 'Middle Funder',
        color: 0x00FF00, // Green
        permissions: memberPermissions,
        reason: 'Created by bot command'
      });

      // Create Small Funder role (Blue-ish RGB)
      const smallFunder = await guild.roles.create({
        name: 'Small Funder',
        color: 0x0000FF, // Blue
        permissions: memberPermissions,
        reason: 'Created by bot command'
      });

      await interaction.editReply({
        content: `✅ Successfully created roles:\n` +
          `🔴 ${bigFunder} - Red (RGB: 255, 0, 0)\n` +
          `🟢 ${middleFunder} - Green (RGB: 0, 255, 0)\n` +
          `🔵 ${smallFunder} - Blue (RGB: 0, 0, 255)\n\n` +
          `All roles have the same permissions as @everyone (member permissions).`
      });
    } catch (error) {
      console.error('Error creating roles:', error);
      await interaction.editReply({
        content: `Error creating roles: ${error.message}`
      });
    }
  }
}

module.exports = { handleCommands };
