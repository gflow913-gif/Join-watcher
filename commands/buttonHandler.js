const { memberData, saveData } = require('../utils/dataManager');
const { getTotalInvites } = require('../utils/inviteTracker');
const { hasActiveTicket, createTicket, closeTicket, getTicketOwner } = require('../utils/depositManager');
const { PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

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

    if (hasActiveTicket(interaction.user.id)) {
      await interaction.reply({
        content: `❌ You already have an open ticket.`,
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
      createTicket(interaction.user.id, ticketChannel.id);
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

      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🎫 Ticket Created')
        .setDescription(`Welcome <@${interaction.user.id}>! Your ticket has been created.`)
        .addFields(
          { name: '💰 Your Rewards', value: `You have **${totalInvites}** invite reward(s) available.`, inline: false },
          { name: '📋 Instructions', value: 'Staff will assist you with deposits, withdrawals, or reward claims.', inline: false },
          { name: '⏰ Next Steps', value: 'Please wait for a staff member to respond.', inline: false }
        )
        .setTimestamp();

      await ticketChannel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [embed],
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
    const ticketOwnerId = getTicketOwner(interaction.channel.id);
    
    if (!ticketOwnerId) {
      await interaction.reply({
        content: '❌ This ticket is not tracked.',
        ephemeral: true
      });
      return;
    }

    const userId = interaction.user.id;
    const OWNER_ID = '1309720025912971355';
    const isOwnerOrTicketOwner = userId === OWNER_ID || userId === ticketOwnerId;

    if (!isOwnerOrTicketOwner) {
      await interaction.reply({
        content: '🚫 Only the ticket owner or admin can close this ticket.',
        ephemeral: true
      });
      return;
    }

    try {
      await interaction.channel.permissionOverwrites.edit(ticketOwnerId, {
        SendMessages: false
      });

      await interaction.reply({
        content: '🔒 Ticket has been locked.'
      });
    } catch (error) {
      console.error('Error locking ticket:', error);
      await interaction.reply({
        content: '❌ Error locking ticket.',
        ephemeral: true
      });
    }
  }

  if (interaction.customId === 'delete_ticket') {
    const ticketOwnerId = getTicketOwner(interaction.channel.id);

    if (!ticketOwnerId) {
      await interaction.reply({
        content: '❌ This ticket is not tracked.',
        ephemeral: true
      });
      return;
    }

    const userId = interaction.user.id;
    const OWNER_ID = '1309720025912971355';
    const isOwnerOrTicketOwner = userId === OWNER_ID || userId === ticketOwnerId;

    if (!isOwnerOrTicketOwner) {
      await interaction.reply({
        content: '🚫 Only the ticket owner or admin can delete this ticket.',
        ephemeral: true
      });
      return;
    }

    delete memberData.activeTickets[ticketOwnerId];
    closeTicket(ticketOwnerId);
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
