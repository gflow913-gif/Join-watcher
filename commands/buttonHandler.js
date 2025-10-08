
const { memberData, saveData } = require('../utils/dataManager');
const { getTotalInvites } = require('../utils/inviteTracker');
const { hasActiveTicket, createTicket, closeTicket, getTicketOwner, getTicketCategory, getTicketType } = require('../utils/depositManager');
const { PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');

const OWNER_ID = '1309720025912971355';

function getAuthorizedRoles(ticketType) {
  const roles = process.env[`${ticketType.toUpperCase()}_ROLES`] || '';
  return roles.split(',').filter(r => r.trim());
}

async function handleButtons(interaction, client) {
  if (interaction.customId === 'create_ticket') {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_ticket_type')
      .setPlaceholder('Choose ticket type')
      .addOptions([
        {
          label: '💰 Deposit',
          description: 'Create a deposit ticket',
          value: 'deposit',
          emoji: '💰'
        },
        {
          label: '💸 Withdraw',
          description: 'Create a withdraw ticket',
          value: 'withdraw',
          emoji: '💸'
        },
        {
          label: '🎰 Gambling',
          description: 'Create a gambling ticket',
          value: 'gambling',
          emoji: '🎰'
        },
        {
          label: '📋 General',
          description: 'Create a general support ticket',
          value: 'general',
          emoji: '📋'
        }
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: '🎫 Please select the type of ticket you want to create:',
      components: [row],
      ephemeral: true
    });
    return;
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
    const ticketType = getTicketType(interaction.channel.id);
    const authorizedRoles = getAuthorizedRoles(ticketType);
    const hasAuthorizedRole = authorizedRoles.some(roleId => interaction.member.roles.cache.has(roleId));
    const isOwnerOrTicketOwner = userId === OWNER_ID || userId === ticketOwnerId || hasAuthorizedRole;

    if (!isOwnerOrTicketOwner) {
      await interaction.reply({
        content: '🚫 Only the ticket owner, owner, or authorized staff can close this ticket.',
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
    const ticketType = getTicketType(interaction.channel.id);
    const authorizedRoles = getAuthorizedRoles(ticketType);
    const hasAuthorizedRole = authorizedRoles.some(roleId => interaction.member.roles.cache.has(roleId));
    const isOwnerOrTicketOwner = userId === OWNER_ID || userId === ticketOwnerId || hasAuthorizedRole;

    if (!isOwnerOrTicketOwner) {
      await interaction.reply({
        content: '🚫 Only the ticket owner, owner, or authorized staff can delete this ticket.',
        ephemeral: true
      });
      return;
    }

    const categoryId = getTicketCategory(interaction.channel.id);

    closeTicket(ticketOwnerId);
    saveData();

    await interaction.reply({
      content: '🗑️ Ticket is being deleted...'
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
        
        if (categoryId) {
          const category = await interaction.guild.channels.fetch(categoryId).catch(() => null);
          if (category && category.children.cache.size === 0) {
            await category.delete();
          }
        }
      } catch (error) {
        console.error('Error deleting ticket/category:', error);
      }
    }, 3000);
  }
}

async function handleSelectMenus(interaction, client) {
  if (interaction.customId === 'select_ticket_type') {
    const ticketType = interaction.values[0];
    const userId = interaction.user.id;

    if (hasActiveTicket(userId, ticketType)) {
      await interaction.update({
        content: `❌ You already have an open ${ticketType} ticket.`,
        components: []
      });
      return;
    }

    const categoryName = ticketType.charAt(0).toUpperCase() + ticketType.slice(1);
    const ticketName = `${ticketType}-${interaction.user.username}`;
    const authorizedRoles = getAuthorizedRoles(ticketType);

    try {
      const category = await interaction.guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
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
            id: OWNER_ID,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
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
          },
          ...authorizedRoles.map(roleId => ({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }))
        ]
      });

      const ticketChannel = await interaction.guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: category.id,
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
            id: OWNER_ID,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels,
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
          },
          ...authorizedRoles.map(roleId => ({
            id: roleId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }))
        ]
      });

      createTicket(userId, ticketChannel.id, ticketType, category.id);
      saveData();

      await interaction.update({
        content: `✅ ${categoryName} ticket created: <#${ticketChannel.id}>`,
        components: []
      });

      const totalInvites = getTotalInvites(userId);

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
        .setTitle(`🎫 ${categoryName} Ticket Created`)
        .setDescription(`Welcome <@${userId}>! Your ${ticketType} ticket has been created.`)
        .addFields(
          { name: '💰 Your Rewards', value: `You have **${totalInvites}** invite reward(s) available.`, inline: false },
          { name: '📋 Instructions', value: `Staff will assist you with your ${ticketType} request.`, inline: false },
          { name: '⏰ Next Steps', value: 'Please wait for a staff member to respond.', inline: false }
        )
        .setTimestamp();

      await ticketChannel.send({
        content: `<@${userId}>`,
        embeds: [embed],
        components: [row]
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.update({
        content: `Error creating ticket: ${error.message}`,
        components: []
      });
    }
  }
}

module.exports = { handleButtons, handleSelectMenus };
