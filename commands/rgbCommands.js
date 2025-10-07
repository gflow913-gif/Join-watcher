
async function handleRgbCommands(interaction) {
  if (interaction.commandName !== 'givergb' && interaction.commandName !== 'removergb') {
    return false;
  }

  const member = interaction.member;
  const guild = interaction.guild;
  const userId = interaction.user.id;
  const ownerId = '1309720025912971355';
  const allowedRoles = ['Big Founder', 'Middle Founder', 'Small Founder'];

  const isAllowed = userId === ownerId || member.roles.cache.some(r => allowedRoles.includes(r.name));

  if (!isAllowed) {
    await interaction.reply({
      content: '🚫 You are not allowed to use this command. Only Founders and the bot owner can use it.',
      ephemeral: true
    });
    return true;
  }

  if (interaction.commandName === 'givergb') {
    let rgbRole = guild.roles.cache.find(r => r.name === 'RGB Name');

    if (!rgbRole) {
      rgbRole = await guild.roles.create({
        name: 'RGB Name',
        color: 0xff0000,
        position: guild.roles.cache.size - 1,
        reason: 'Created for RGB glowing name system'
      });

      let hue = 0;
      setInterval(async () => {
        if (!rgbRole || !guild.roles.cache.has(rgbRole.id)) return;
        hue = (hue + 8) % 360;
        const color = hslToHex(hue, 100, 50);
        await rgbRole.setColor(color).catch(() => {});
      }, 500);
    }

    await member.roles.add(rgbRole).catch(console.error);
    await interaction.reply({
      content: '🌈 RGB effect added! Your name will now glow smoothly with colors.',
      ephemeral: true
    });
    return true;
  }

  if (interaction.commandName === 'removergb') {
    const rgbRole = member.guild.roles.cache.find(r => r.name === 'RGB Name');

    if (!rgbRole || !member.roles.cache.has(rgbRole.id)) {
      await interaction.reply({
        content: '❌ You don\'t currently have the RGB Name role.',
        ephemeral: true
      });
      return true;
    }

    await member.roles.remove(rgbRole).catch(console.error);
    await interaction.reply({
      content: '✅ RGB effect removed. Your name color is now normal again.',
      ephemeral: true
    });
    return true;
  }

  return false;
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${Math.round(f(0) * 255).toString(16).padStart(2, '0')}${Math.round(f(8) * 255).toString(16).padStart(2, '0')}${Math.round(f(4) * 255).toString(16).padStart(2, '0')}`;
}

module.exports = { handleRgbCommands };
