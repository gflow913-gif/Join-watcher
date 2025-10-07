const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { memberData, saveData } = require('../utils/dataManager');
const { getTotalInvites } = require('../utils/inviteTracker');

async function handleTicketCommands(interaction) {
  if (interaction.commandName === 'setupticket') {
    const guild = interaction.guild;
    let category = guild.channels.cache.find(c => c.name === 'Tickets' && c.type === ChannelType.GuildCategory);

    if (!category) {
      category = await guild.channels.create({
        name: 'Tickets',
        type: ChannelType.GuildCategory,
      });
    }

    memberData.ticketConfig.categoryId = category.id;
    saveData();

    await interaction.reply({ content: '🎫 Ticket system setup complete.', ephemeral: true });
    return true;
  }

  if (interaction.commandName === 'createroles') {
    const guild = interaction.guild;
    const colors = ['#ff0000', '#00ff00', '#0000ff'];
    for (const color of colors) {
      await guild.roles.create({
        name: `RGB-${color}`,
        color,
      });
    }
    await interaction.reply({ content: '✅ RGB color roles created!', ephemeral: true });
    return true;
  }

  if (interaction.commandName === 'setticketconfig') {
    const channelId = interaction.options.getString('channel');
    const namePrefix = interaction.options.getString('nameprefix') || 'ticket';
    const categoryId = interaction.options.getString('category') || null;

    memberData.ticketConfig = {
      channelId,
      namePrefix,
      ticketCounter: 0,
      categoryId
    };

    saveData();
    await interaction.reply({ content: `✅ Ticket config saved:\nChannel: ${channelId}\nPrefix: ${namePrefix}\nCategory: ${categoryId || 'None'}`, ephemeral: true });
    return true;
  }

  if (interaction.commandName === 'createticket') {
    const userId = interaction.user.id;
    
    if (memberData.activeTickets[userId]) {
      await interaction.reply({ content: '❌ You already have an open ticket.', ephemeral: true });
      return true;
    }

    const config = memberData.ticketConfig;
    const ticketName = `ticket-${interaction.user.username}`;
    
    try {
      const ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: config.categoryId || null,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: userId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });

      memberData.activeTickets[userId] = ticketChannel.id;
      saveData();

      const totalInvites = getTotalInvites(userId);
      
      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Secondary);

      const deleteButton = new ButtonBuilder()
        .setCustomId('delete_ticket')
        .setLabel('🗑️ Delete Ticket')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton, deleteButton);

      await ticketChannel.send({
        content: `<@${userId}>\n\nYou will get **${totalInvites}** reward(s) for your total invites.\nPlease wait for a staff member to verify your claim.`,
        components: [row]
      });

      await interaction.reply({ content: `✅ Ticket created: <#${ticketChannel.id}>`, ephemeral: true });
      return true;
    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({ content: '❌ Failed to create ticket.', ephemeral: true });
      return true;
    }
  }

  if (interaction.commandName === 'closeticket') {
    const channel = interaction.channel;
    const ticketOwnerId = Object.keys(memberData.activeTickets).find(
      userId => memberData.activeTickets[userId] === channel.id
    );

    if (!ticketOwnerId) {
      await interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
      return true;
    }

    try {
      await channel.delete();
      delete memberData.activeTickets[ticketOwnerId];
      saveData();
    } catch (error) {
      console.error('Error closing ticket:', error);
      await interaction.reply({ content: '❌ Failed to close ticket.', ephemeral: true });
    }
    return true;
  }

  return false;
}

module.exports = { handleTicketCommands };
