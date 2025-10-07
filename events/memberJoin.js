
const { checkEligibility, memberData } = require('../utils/dataManager');

async function handleMemberJoin(member, client) {
  console.log(`New member joined: ${member.user.tag} (${member.user.id})`);

  const isNewMember = !memberData.members[member.user.id] || memberData.members[member.user.id].joins.length === 0;
  
  const result = checkEligibility(member.user.id, isNewMember);

  console.log(`Eligibility check for ${member.user.tag}:`);
  console.log(`- Eligible: ${result.eligible}`);
  console.log(`- Reason: ${result.reason}`);
  console.log(`- Payment owed: ${result.owed}sx`);

  try {
    const logChannel = member.guild.channels.cache.find(
      ch => ch.name === 'join-logs' || ch.name === 'logs' || ch.type === 0
    );

    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({
        content: `**Member Join Detected**\n` +
          `User: ${member.user.tag} (<@${member.user.id}>)\n` +
          `Status: ${result.eligible ? '✅ Eligible (NEW)' : '❌ Not Eligible (REJOIN)'}\n` +
          `Payment: ${result.owed}sx\n` +
          `Total Eligible Joins: ${memberData.totalEligibleJoins}\n` +
          `Total Payment Due: ${memberData.totalPaymentDue}sx`
      });
    }
  } catch (error) {
    console.error('Error sending log message:', error);
  }
}

module.exports = { handleMemberJoin };
