
async function handleFounderCommands(interaction) {
  const ownerId = '1309720025912971355';
  const userId = interaction.user.id;

  if (interaction.commandName === 'givefounder') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 You are not authorized to use this command. Only the bot owner can assign Founder roles.',
        ephemeral: true
      });
      return true;
    }

    const targetUser = interaction.options.getUser('user');
    const roleName = interaction.options.getString('role');
    const guild = interaction.guild;
    const targetMember = await guild.members.fetch(targetUser.id);

    let founderRole = guild.roles.cache.find(r => r.name === roleName);

    if (!founderRole) {
      const botMember = await guild.members.fetch(interaction.client.user.id);
      const botTopRole = botMember.roles.highest;
      
      founderRole = await guild.roles.create({
        name: roleName,
        hoist: true,
        position: botTopRole.position - 1,
        reason: `Created by ${interaction.user.username} for Founder role system`
      });
    } else {
      const botMember = await guild.members.fetch(interaction.client.user.id);
      const botTopRole = botMember.roles.highest;
      
      await founderRole.edit({ 
        hoist: true,
        position: botTopRole.position - 1
      }).catch(console.error);
    }

    await targetMember.roles.add(founderRole).catch(console.error);
    await interaction.reply({
      content: `✅ Successfully assigned **${roleName}** role to ${targetUser.username}!`,
      ephemeral: true
    });
    return true;
  }

  if (interaction.commandName === 'fixfounder') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 You are not authorized to use this command.',
        ephemeral: true
      });
      return true;
    }

    const guild = interaction.guild;
    const founderRoleNames = ['Big Founder', 'Middle Founder', 'Small Founder'];
    const botMember = await guild.members.fetch(interaction.client.user.id);
    const botTopRole = botMember.roles.highest;

    let fixedCount = 0;
    let message = '🔧 Fixing Founder roles...\n\n';

    for (const roleName of founderRoleNames) {
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (role) {
        try {
          await role.edit({
            hoist: true,
            position: botTopRole.position - 1
          });
          message += `✅ Fixed: ${roleName}\n`;
          fixedCount++;
        } catch (error) {
          message += `❌ Failed: ${roleName} - ${error.message}\n`;
        }
      } else {
        message += `⚠️ Not found: ${roleName}\n`;
      }
    }

    message += `\n📊 Fixed ${fixedCount} role(s). RGB animation should work now!`;
    await interaction.reply({ content: message, ephemeral: true });
    return true;
  }

  if (interaction.commandName === 'cleanduplicates') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 You are not authorized to use this command.',
        ephemeral: true
      });
      return true;
    }

    const guild = interaction.guild;
    const founderRoleNames = ['Big Founder', 'Middle Founder', 'Small Founder'];
    let deletedCount = 0;
    let message = '🧹 Cleaning duplicate Founder roles...\n\n';

    for (const roleName of founderRoleNames) {
      const duplicateRoles = guild.roles.cache.filter(r => r.name === roleName);
      
      if (duplicateRoles.size > 1) {
        message += `Found ${duplicateRoles.size} copies of **${roleName}**\n`;
        
        const rolesArray = Array.from(duplicateRoles.values());
        const roleToKeep = rolesArray[0];
        
        for (let i = 1; i < rolesArray.length; i++) {
          try {
            await rolesArray[i].delete();
            deletedCount++;
            message += `  ✅ Deleted duplicate #${i}\n`;
          } catch (error) {
            message += `  ❌ Failed to delete duplicate #${i}: ${error.message}\n`;
          }
        }
        message += `  ✅ Kept role ID: ${roleToKeep.id}\n\n`;
      } else if (duplicateRoles.size === 1) {
        message += `✅ **${roleName}** - No duplicates found\n`;
      } else {
        message += `⚠️ **${roleName}** - Not found\n`;
      }
    }

    message += `\n📊 Deleted ${deletedCount} duplicate role(s)!`;
    await interaction.reply({ content: message, ephemeral: true });
    return true;
  }

  if (interaction.commandName === 'startrgb') {
    if (userId !== ownerId) {
      await interaction.reply({
        content: '🚫 You are not authorized to use this command.',
        ephemeral: true
      });
      return true;
    }

    const { startFounderRgbAnimation } = require('../utils/founderRgbAnimation');
    startFounderRgbAnimation(interaction.client);
    
    await interaction.reply({
      content: '🌈 RGB animation started!\n\n⚠️ **Warning:** This will cause rate limits and slow down other commands. RGB updates every 5 seconds per role.',
      ephemeral: true
    });
    return true;
  }

  return false;
}

module.exports = { handleFounderCommands };
