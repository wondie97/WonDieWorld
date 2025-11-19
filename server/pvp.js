// 단순한 1vs1 & 배틀존 상태 관리 (기본 버전)

let queue1v1 = [];               // { ws, userId }
const pvpPlayers = {};           // { userId: { hp, zone } }

function request1v1(ws, userId, sendToClient) {
  queue1v1.push({ ws, userId });

  if (queue1v1.length >= 2) {
    const p1 = queue1v1.shift();
    const p2 = queue1v1.shift();

    const roomId = "arena_" + Date.now();

    sendToClient(p1.ws, { type: "pvp_match_found", opponent: p2.userId, roomId });
    sendToClient(p2.ws, { type: "pvp_match_found", opponent: p1.userId, roomId });

    pvpPlayers[p1.userId] = { hp: 100, zone: "arena", roomId };
    pvpPlayers[p2.userId] = { hp: 100, zone: "arena", roomId };
  }
}

function handleDamage(attackerId, targetId, damage, broadcast) {
  if (!pvpPlayers[targetId]) return;
  pvpPlayers[targetId].hp -= damage;

  if (pvpPlayers[targetId].hp <= 0) {
    broadcast({
      type: "pvp_dead",
      userId: targetId
    });
  } else {
    broadcast({
      type: "pvp_hp_update",
      userId: targetId,
      hp: pvpPlayers[targetId].hp
    });
  }
}

function enterBattleZone(userId) {
  if (!pvpPlayers[userId]) pvpPlayers[userId] = { hp: 100 };
  pvpPlayers[userId].zone = "battle";
}

function leaveBattleZone(userId) {
  if (!pvpPlayers[userId]) return;
  pvpPlayers[userId].zone = null;
}

module.exports = {
  request1v1,
  handleDamage,
  enterBattleZone,
  leaveBattleZone,
  pvpPlayers
};
