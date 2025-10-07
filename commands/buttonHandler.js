const { memberData, saveData } = require('../utils/dataManager');
const { getTotalInvites } = require('../utils/inviteTracker');
const { PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function handleButtons(interaction, client) {
  if (interaction.customId === 'create_ticket') {
    if (!memberData.ticketConfig) {
      memberData.ticketConfig = {
        channelId: null,
        namePrefix: 'ticket',
        ticketCounter: 0,
        categoryId: null
      };
    }

    if (memberData.activeTickets[interaction.user.id]) {
      await interaction.reply({
        content: `You already have an open ticket.`,
        ephemeral: true
      });
      return;
    }

    const ticketConfig = memberData.ticketConfig;
    const ticketName = `ticket-${interaction.user.username}`;

    try {
      const ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: ticketConfig.categoryId,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ]
      });

      memberData.activeTickets[interaction.user.id] = ticketChannel.id;
      saveData();

      await interaction.reply({
        content: `✅ Ticket created: <#${ticketChannel.id}>`,
        ephemeral: true
      });

      const totalInvites = getTotalInvites(interaction.user.id);

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Secondary);

      const deleteButton = new ButtonBuilder()
        .setCustomId('delete_ticket')
        .setLabel('🗑️ Delete Ticket')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder()
        .addComponents(closeButton, deleteButton);

      await ticketChannel.send({
        content: `<@${interaction.user.id}>\n\nYou will get **${totalInvites}** reward(s) for your total invites.\nPlease wait for a staff member to verify your claim.`,
        components: [row]
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content: `Error creating ticket: ${error.message}`,
        ephemeral: true
      });
    }
  }

  if (interaction.customId === 'close_ticket') {
    if (!memberData.activeTickets) {
      memberData.activeTickets = {};
    }

    const userId = Object.keys(memberData.activeTickets).find(
      key => memberData.activeTickets[key] === interaction.channel.id
    );

    if (!userId) {
      await interaction.reply({
        content: 'This ticket is not tracked.',
        ephemeral: true
      });
      return;
    }

    try {
      await interaction.channel.permissionOverwrites.edit(userId, {
        SendMessages: false
      });

      await interaction.reply({
        content: '🔒 Ticket has been locked.'
      });
    } catch (error) {
      console.error('Error locking ticket:', error);
      await interaction.reply({
        content: 'Error locking ticket.',
        ephemeral: true
      });
    }
  }

  if (interaction.customId === 'delete_ticket') {
    if (!memberData.activeTickets) {
      memberData.activeTickets = {};
    }

    const userId = Object.keys(memberData.activeTickets).find(
      key => memberData.activeTickets[key] === interaction.channel.id
    );

    if (!userId) {
      await interaction.reply({
        content: 'This ticket is not tracked.',
        ephemeral: true
      });
      return;
    }

    delete memberData.activeTickets[userId];
    saveData();

    await interaction.reply({
      content: '🗑️ Ticket is being deleted...'
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (error) {
        console.error('Error deleting ticket channel:', error);
      }
    }, 3000);
  }
}

module.exports = { handleButtons };
