
const { PermissionFlagsBits, ChannelType } = require('discord.js');

const OWNER_ID = '1309720025912971355';

function getAuthorizedRoles() {
  const depositRoles = (process.env.DEPOSIT_ROLES || '').split(',').filter(r => r.trim());
  const withdrawRoles = (process.env.WITHDRAW_ROLES || '').split(',').filter(r => r.trim());
  const gamblingRoles = (process.env.GAMBLING_ROLES || '').split(',').filter(r => r.trim());
  const generalRoles = (process.env.GENERAL_ROLES || '').split(',').filter(r => r.trim());
  
  return [...new Set([...depositRoles, ...withdrawRoles, ...gamblingRoles, ...generalRoles])];
}

async function handleTicketManagementCommands(interaction) {
  const userId = interaction.user.id;
  const member = interaction.member;

  const isOwner = userId === OWNER_ID;
  const authorizedRoles = getAuthorizedRoles();
  const hasRole = authorizedRoles.some(roleId => member.roles.cache.has(roleId));
  const isAuthorized = isOwner || hasRole;

  if (interaction.commandName === 'deletetickets') {
    if (!isAuthorized) {
      await interaction.reply({
        content: '🚫 You do not have permission to use this command.',
        ephemeral: true
      });
      return true;
    }

    const prefix = interaction.options.getString('prefix');
    const guild = interaction.guild;

    await interaction.deferReply({ ephemeral: true });

    try {
      const channels = guild.channels.cache.filter(
        channel => channel.type === ChannelType.GuildText && channel.name.startsWith(prefix)
      );

      if (channels.size === 0) {
        await interaction.editReply({
          content: `❌ No channels found starting with "${prefix}"`
        });
        return true;
      }

      let deletedCount = 0;
      for (const [id, channel] of channels) {
        try {
          await channel.delete();
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete channel ${channel.name}:`, error);
        }
      }

      await interaction.editReply({
        content: `✅ Successfully deleted ${deletedCount} channel(s) starting with "${prefix}"`
      });
    } catch (error) {
      console.error('Error deleting tickets:', error);
      await interaction.editReply({
        content: '❌ An error occurred while deleting tickets.'
      });
    }
    return true;
  }

  return false;
}

module.exports = { handleTicketManagementCommands };
