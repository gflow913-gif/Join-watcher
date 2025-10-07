
const { memberData, saveData } = require('../utils/dataManager');
const { markInviteAsClaimed, getTotalInvites } = require('../utils/inviteTracker');

async function handleBasicCommands(interaction) {
  if (interaction.commandName === 'checkuser') {
    await interaction.reply({ content: `👤 Checked user: ${interaction.user.username}`, ephemeral: true });
    return true;
  }

  if (interaction.commandName === 'stats') {
    const guild = interaction.guild;
    await interaction.reply({
      content: `📊 Server Stats:\nMembers: ${guild.memberCount}\nName: ${guild.name}`,
      ephemeral: true
    });
    return true;
  }

  if (interaction.commandName === 'scanexisting') {
    const guild = interaction.guild;
    const members = await guild.members.fetch();
    let count = 0;

    members.forEach(member => {
      if (!member.user.bot && !memberData[member.id]) {
        memberData[member.id] = { joinedAt: member.joinedAt, claimed: false };
        count++;
      }
    });

    saveData();
    await interaction.reply({ content: `🔍 Scanned ${count} new members and added to database.`, ephemeral: true });
    return true;
  }

  if (interaction.commandName === 'unclaimed') {
    const unclaimed = Object.entries(memberData)
      .filter(([_, data]) => !data.claimed)
      .map(([id]) => `<@${id}>`);

    if (unclaimed.length === 0) {
      await interaction.reply({ content: '✅ All joins are claimed.', ephemeral: true });
    } else {
      await interaction.reply({ content: `🧾 Unclaimed Joins:\n${unclaimed.join('\n')}`, ephemeral: true });
    }
    return true;
  }

  if (interaction.commandName === 'claim') {
    const user = interaction.options.getUser('user');
    if (!user) {
      await interaction.reply({ content: '❌ No user specified.', ephemeral: true });
      return true;
    }
    if (!memberData.members || !memberData.members[user.id]) {
      await interaction.reply({ content: '❌ User not found in database.', ephemeral: true });
      return true;
    }

    const member = memberData.members[user.id];
    if (member.inviterId) {
      markInviteAsClaimed(member.inviterId, user.id);
      const newTotal = getTotalInvites(member.inviterId);
      await interaction.reply({ 
        content: `✅ Marked ${user.username} as claimed. Inviter's new total: ${newTotal}`, 
        ephemeral: true 
      });
    } else {
      member.claimed = true;
      saveData();
      await interaction.reply({ content: `✅ Marked ${user.username} as claimed (no inviter found).`, ephemeral: true });
    }
    return true;
  }

  return false;
}

module.exports = { handleBasicCommands };
