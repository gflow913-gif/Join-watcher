
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

    await interaction.deferReply({ ephemeral: true });

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
        color: 0xFF0000,
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
    await interaction.editReply({
      content: `✅ Successfully assigned **${roleName}** role to ${targetUser.username}!`
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

    await interaction.deferReply({ ephemeral: true });

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
            position: botTopRole.position - 1,
            color: 0xFF0000
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
    await interaction.editReply({ content: message });
    return true;
  }

  return false;
}

module.exports = { handleFounderCommands };
