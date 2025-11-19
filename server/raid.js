const RAID_ROOMS = {};
const MAX_PLAYERS = 8;

function newBoss() {
  return {
    id: "kraken",
    maxHp: 50000,
    hp: 50000,
    phase: 1
  };
}

function joinRaid(ws, userId, broadcast) {
  let room = RAID_ROOMS["kraken"];
  if (!room) {
    RAID_ROOMS["kraken"] = {
      players: [],
      boss: newBoss()
    };
    room = RAID_ROOMS["kraken"];
  }

  if (room.players.find(p => p.userId === userId)) {
    return;
  }

  if (room.players.length >= MAX_PLAYERS) {
    ws.send(JSON.stringify({ type: "raid_full" }));
    return;
  }

  room.players.push({ ws, userId });

  broadcast({
    type: "raid_join",
    userId,
    members: room.players.map(p => p.userId)
  });
}

function damageBoss(userId, amount, broadcast) {
  const room = RAID_ROOMS["kraken"];
  if (!room) return;

  room.boss.hp -= amount;
  if (room.boss.hp < 0) room.boss.hp = 0;

  broadcast({
    type: "raid_boss_hp",
    hp: room.boss.hp,
    max: room.boss.maxHp
  });

  if (room.boss.hp <= room.boss.maxHp * 0.5 && room.boss.phase === 1) {
    room.boss.phase = 2;
    broadcast({ type: "raid_phase2" });
  }

  if (room.boss.hp <= 0) {
    broadcast({ type: "raid_clear" });
    room.boss = newBoss();
  }
}

module.exports = {
  joinRaid,
  damageBoss
};
