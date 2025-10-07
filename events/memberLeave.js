const { memberData, saveData } = require('../utils/dataManager');
const { removeInvite } = require('../utils/inviteTracker');

async function handleMemberLeave(member, client) {
  console.log(`Member left: ${member.user.tag} (${member.user.id})`);

  const memberInfo = memberData.members[member.user.id];
  
  if (memberInfo && memberInfo.inviterId) {
    const inviterId = memberInfo.inviterId;
    const inviteType = memberInfo.inviteType || 'regular';
    const newTotal = removeInvite(inviterId, inviteType);
    console.log(`Updated invites for ${inviterId}: ${newTotal} (member ${member.user.tag} left, type: ${inviteType})`);
  } else {
    console.log(`No inviter found for ${member.user.tag} - invite count not adjusted`);
  }
}

module.exports = { handleMemberLeave };
