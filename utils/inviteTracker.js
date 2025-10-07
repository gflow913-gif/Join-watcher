const { memberData, saveData } = require('./dataManager');

function initializeInviteTracker(userId) {
  if (!memberData.inviteTracker[userId]) {
    memberData.inviteTracker[userId] = {
      regularInvites: 0,
      leftInvites: 0,
      fakeInvites: 0,
      claimedInvites: 0,
      bonusInvites: 0
    };
  }
  return memberData.inviteTracker[userId];
}

function getTotalInvites(userId) {
  const tracker = memberData.inviteTracker[userId] || initializeInviteTracker(userId);
  return tracker.regularInvites - tracker.leftInvites - tracker.fakeInvites - tracker.claimedInvites + tracker.bonusInvites;
}

function addInvite(userId, type = 'regular') {
  const tracker = initializeInviteTracker(userId);
  
  switch(type) {
    case 'regular':
      tracker.regularInvites++;
      break;
    case 'left':
      tracker.leftInvites++;
      break;
    case 'fake':
      tracker.fakeInvites++;
      break;
    case 'claimed':
      tracker.claimedInvites++;
      break;
    case 'bonus':
      tracker.bonusInvites++;
      break;
  }
  
  saveData();
}

function removeInvite(userId, inviteType = 'regular') {
  const tracker = initializeInviteTracker(userId);
  
  switch(inviteType) {
    case 'regular':
      tracker.leftInvites++;
      break;
    case 'fake':
      break;
    case 'bonus':
      break;
    case 'claimed':
      break;
  }
  
  saveData();
  return getTotalInvites(userId);
}

function markInviteAsFake(inviterId, memberId) {
  const tracker = initializeInviteTracker(inviterId);
  const member = memberData.members[memberId];
  
  if (member && member.inviterId === inviterId && member.inviteType === 'regular') {
    tracker.fakeInvites++;
    member.inviteType = 'fake';
    saveData();
  }
  
  return getTotalInvites(inviterId);
}

function addBonusInvites(userId, amount = 1) {
  const tracker = initializeInviteTracker(userId);
  tracker.bonusInvites += amount;
  saveData();
  return getTotalInvites(userId);
}

function markInviteAsClaimed(inviterId, memberId) {
  const tracker = initializeInviteTracker(inviterId);
  const member = memberData.members[memberId];
  
  if (member && member.inviterId === inviterId && member.inviteType === 'regular') {
    tracker.claimedInvites++;
    member.inviteType = 'claimed';
    saveData();
  }
  
  return getTotalInvites(inviterId);
}

async function updateInviteCache(guild) {
  try {
    const invites = await guild.invites.fetch();
    memberData.invites[guild.id] = {};
    
    invites.forEach(invite => {
      memberData.invites[guild.id][invite.code] = {
        code: invite.code,
        uses: invite.uses,
        inviter: invite.inviter?.id
      };
    });
    
    saveData();
  } catch (error) {
    console.error('Error updating invite cache:', error);
  }
}

async function findInviter(guild) {
  try {
    const newInvites = await guild.invites.fetch();
    const oldInvites = memberData.invites[guild.id] || {};
    
    for (const [code, invite] of newInvites) {
      const oldInvite = oldInvites[code];
      
      if (oldInvite && invite.uses > oldInvite.uses) {
        await updateInviteCache(guild);
        return invite.inviter;
      }
    }
    
    for (const code of Object.keys(oldInvites)) {
      if (!newInvites.has(code)) {
        const deletedInvite = oldInvites[code];
        await updateInviteCache(guild);
        
        if (deletedInvite.inviter) {
          const inviter = await guild.members.fetch(deletedInvite.inviter).catch(() => null);
          if (inviter) return inviter.user;
        }
      }
    }
    
    await updateInviteCache(guild);
    return null;
  } catch (error) {
    console.error('Error finding inviter:', error);
    return null;
  }
}

module.exports = {
  initializeInviteTracker,
  getTotalInvites,
  addInvite,
  removeInvite,
  markInviteAsFake,
  addBonusInvites,
  markInviteAsClaimed,
  updateInviteCache,
  findInviter
};
