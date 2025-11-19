const guilds = {};   // { guildId: { name, leaderId, members: [] } }
const zones = { A: null, B: null, C: null };

function createGuild(guildId, name, leaderId) {
  if (guilds[guildId]) return false;
  guilds[guildId] = {
    name,
    leaderId,
    members: [leaderId]
  };
  return true;
}

function joinGuild(guildId, userId) {
  if (!guilds[guildId]) return false;
  if (!guilds[guildId].members.includes(userId)) {
    guilds[guildId].members.push(userId);
  }
  return true;
}

function captureZone(zoneKey, guildId, broadcast) {
  zones[zoneKey] = guildId;
  broadcast({
    type: "guild_capture",
    zone: zoneKey,
    guildId
  });
}

module.exports = {
  createGuild,
  joinGuild,
  captureZone,
  guilds,
  zones
};
