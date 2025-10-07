const { checkEligibility, memberData, saveData } = require('../utils/dataManager');
const { findInviter, addInvite, initializeInviteTracker } = require('../utils/inviteTracker');

const WELCOME_CHANNEL_ID = '1408275535435661363';

async function handleMemberJoin(member, client) {
  console.log(`New member joined: ${member.user.tag} (${member.user.id})`);

  const isNewMember = !memberData.members[member.user.id] || memberData.members[member.user.id].joins.length === 0;
  
  const result = checkEligibility(member.user.id, isNewMember);

  console.log(`Eligibility check for ${member.user.tag}:`);
  console.log(`- Eligible: ${result.eligible}`);
  console.log(`- Reason: ${result.reason}`);
  console.log(`- Payment owed: ${result.owed}sx`);

  const inviter = await findInviter(member.guild);
  
  if (inviter) {
    const inviteType = 'regular';
    addInvite(inviter.id, inviteType);
    console.log(`Inviter found: ${inviter.tag} (${inviter.id})`);
    
    if (!memberData.members[member.user.id]) {
      memberData.members[member.user.id] = {
        userId: member.user.id,
        firstJoin: new Date().toISOString(),
        joins: [],
        eligibleJoins: 0,
        totalOwed: 0
      };
    }
    memberData.members[member.user.id].inviterId = inviter.id;
    memberData.members[member.user.id].inviteType = inviteType;
    saveData();
  }

  try {
    const welcomeChannel = await client.channels.fetch(WELCOME_CHANNEL_ID).catch(() => null);
    
    if (welcomeChannel && welcomeChannel.isTextBased()) {
      const totalMembers = member.guild.memberCount;
      
      if (inviter) {
        await welcomeChannel.send(
          `🎉 Welcome <@${member.user.id}>! Invited by <@${inviter.id}> 🎉\n` +
          `This server now has **${totalMembers}** total members!`
        );
      } else {
        await welcomeChannel.send(
          `🎉 Welcome <@${member.user.id}>! We couldn't find who invited you 🎉\n` +
          `This server now has **${totalMembers}** total members!`
        );
      }
    }
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }

  try {
    const logChannel = member.guild.channels.cache.find(
      ch => ch.name === 'join-logs' || ch.name === 'logs' || ch.type === 0
    );

    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({
        content: `**Member Join Detected**\n` +
          `User: ${member.user.tag} (<@${member.user.id}>)\n` +
          `Inviter: ${inviter ? `${inviter.tag} (<@${inviter.id}>)` : 'Unknown'}\n` +
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
