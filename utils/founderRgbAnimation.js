function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return `#${Math.round(f(0) * 255).toString(16).padStart(2, '0')}${Math.round(f(8) * 255).toString(16).padStart(2, '0')}${Math.round(f(4) * 255).toString(16).padStart(2, '0')}`;
}

async function startFounderRgbAnimation(client) {
  console.log('🌈 Starting Founder RGB animation...');

  const founderRoles = ['Big Founder', 'Middle Founder', 'Small Founder'];
  let hue = 0;

  setInterval(async () => {
    hue = (hue + 3) % 360;
    const color = hslToHex(hue, 100, 50);

    client.guilds.cache.forEach(async (guild) => {
      founderRoles.forEach(async (roleName) => {
        const role = guild.roles.cache.find(r => r.name === roleName);
        if (role) {
          await role.setColor(color).catch(() => {});
        }
      });
    });
  }, 1000);

  console.log('✅ Founder RGB animation started successfully!');
}

module.exports = { startFounderRgbAnimation };
