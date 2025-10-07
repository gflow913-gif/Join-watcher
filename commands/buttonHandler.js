
const { memberData, saveData } = require('../utils/dataManager');
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

    const ticketConfig = memberData.ticketConfig;

    if (!ticketConfig.channelId) {
      await interaction.reply({
        content: 'Ticket system is not set up yet.',
        ephemeral: true
      });
      return;
    }

    if (memberData.activeTickets[interaction.user.id]) {
      await interaction.reply({
        content: `❌ You already have an active ticket: <#${memberData.activeTickets[interaction.user.id]}>`,
        ephemeral: true
      });
      return;
    }

    ticketConfig.ticketCounter++;
    const ticketName = `${ticketConfig.namePrefix}-${ticketConfig.ticketCounter}`;

    saveData();

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
            id: '1309720025912971355',
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

      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Danger);

      const closeRow = new ActionRowBuilder()
        .addComponents(closeButton);

      await ticketChannel.send({
        content: `Welcome <@${interaction.user.id}>! This is your private ticket channel.\n\nIt may take up to 24 hours for a payout manager to respond. So please have some patience.`,
        components: [closeRow]
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

    if (interaction.user.id !== userId && interaction.user.id !== '1309720025912971355') {
      await interaction.reply({
        content: 'Only the ticket creator or the owner can close this ticket.',
        ephemeral: true
      });
      return;
    }

    delete memberData.activeTickets[userId];
    saveData();

    await interaction.reply({
      content: '🔒 Ticket is being closed...'
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
