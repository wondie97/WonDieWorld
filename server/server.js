const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const db = require("./db");
const auth = require("./auth");
const pvp = require("./pvp");
const raid = require("./raid");
const guild = require("./guild");
const friends = require("./friends");
const market = require("./market");

const PORT = process.env.PORT || 3000;

// HTTP 서버 (헬스체크용)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WonDieWorld Server Running");
});

const wss = new WebSocket.Server({ server });

const clients = new Map(); // ws -> { userId }

function broadcast(data, excludeWs = null) {
  const msg = JSON.stringify(data);
  for (const [ws] of clients) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function sendTo(ws, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

wss.on("connection", (ws) => {
  console.log("▶ client connected");
  clients.set(ws, { userId: null });

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return;
    }

    const state = clients.get(ws) || { userId: null };

    // 회원가입
    if (data.type === "register") {
      return auth.register(data.username, data.password, (err, result) => {
        if (err) {
          return sendTo(ws, { type: "register_error", error: err.error });
        }
        sendTo(ws, { type: "register_ok" });
      });
    }

    // 로그인
    if (data.type === "login") {
      return auth.login(data.username, data.password, (err, result) => {
        if (err) {
          return sendTo(ws, { type: "login_error", error: err.error });
        }
        clients.set(ws, { userId: result.userId });
        sendTo(ws, {
          type: "login_ok",
          token: result.token,
          userId: result.userId
        });
      });
    }

    // 위치 이동 싱크
    if (data.type === "move") {
      if (!state.userId) return;
      broadcast({
        type: "player_move",
        userId: state.userId,
        x: data.x,
        y: data.y,
        dir: data.dir
      }, ws);
      return;
    }

    // 1v1 PVP 요청
    if (data.type === "pvp_request") {
      if (!state.userId) return;
      pvp.request1v1(ws, state.userId, sendTo);
      return;
    }

    // PVP 데미지
    if (data.type === "pvp_damage") {
      if (!state.userId) return;
      pvp.handleDamage(state.userId, data.targetId, data.damage, broadcast);
      return;
    }

    // 배틀존 입장/퇴장
    if (data.type === "battle_enter") {
      if (!state.userId) return;
      pvp.enterBattleZone(state.userId);
      return;
    }
    if (data.type === "battle_leave") {
      if (!state.userId) return;
      pvp.leaveBattleZone(state.userId);
      return;
    }

    // 레이드 참가
    if (data.type === "raid_join") {
      if (!state.userId) return;
      raid.joinRaid(ws, state.userId, (payload) => broadcast(payload));
      return;
    }

    if (data.type === "raid_damage") {
      if (!state.userId) return;
      raid.damageBoss(state.userId, data.amount, broadcast);
      return;
    }

    // 길드 생성/가입/점령
    if (data.type === "guild_create") {
      if (!state.userId) return;
      const ok = guild.createGuild(data.guildId, data.name, state.userId);
      sendTo(ws, { type: "guild_create_result", ok });
      return;
    }

    if (data.type === "guild_join") {
      if (!state.userId) return;
      const ok = guild.joinGuild(data.guildId, state.userId);
      sendTo(ws, { type: "guild_join_result", ok });
      return;
    }

    if (data.type === "guild_capture") {
      if (!state.userId) return;
      guild.captureZone(data.zone, data.guildId, broadcast);
      return;
    }

    // 친구 시스템
    if (data.type === "friend_add") {
      if (!state.userId) return;
      friends.addFriend(state.userId, data.friendId, (ok) => {
        sendTo(ws, { type: "friend_add_result", ok });
      });
      return;
    }

    if (data.type === "friend_list") {
      if (!state.userId) return;
      friends.getFriends(state.userId, (list) => {
        sendTo(ws, { type: "friend_list_result", list });
      });
      return;
    }

    // 선물(우편)
    if (data.type === "mail_send") {
      if (!state.userId) return;
      friends.sendMail(data.to, state.userId, data.item, data.message || "", (ok) => {
        sendTo(ws, { type: "mail_send_result", ok });
      });
      return;
    }

    if (data.type === "mail_list") {
      if (!state.userId) return;
      friends.getMail(state.userId, (rows) => {
        sendTo(ws, { type: "mail_list_result", items: rows });
      });
      return;
    }

    if (data.type === "mail_take") {
      friends.takeMail(data.mailId, (ok) => {
        sendTo(ws, { type: "mail_take_result", ok, mailId: data.mailId });
      });
      return;
    }

    // 거래소
    if (data.type === "market_list_item") {
      if (!state.userId) return;
      market.listItem(state.userId, data.item, data.price, (ok) => {
        sendTo(ws, { type: "market_list_item_result", ok });
      });
      return;
    }

    if (data.type === "market_get") {
      market.getMarket((rows) => {
        sendTo(ws, { type: "market_get_result", items: rows });
      });
      return;
    }

    if (data.type === "market_buy") {
      if (!state.userId) return;
      market.buyItem(data.marketId, state.userId, (ok) => {
        sendTo(ws, { type: "market_buy_result", ok, marketId: data.marketId });
      });
      return;
    }
  });

  ws.on("close", () => {
    console.log("▶ client disconnected");
    clients.delete(ws);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 WonDieWorld Multiplayer Server Running on ${PORT}`);
});
