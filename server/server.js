
const path = require("path");
const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const db = require("./db");
const progression = require("./progression");
const { router: authRouter, JWT_SECRET } = require("./authRoutes");

const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// 정적 파일
app.use(express.static(path.join(__dirname, "..", "client")));

// Auth REST API
app.use("/api", authRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

const players = new Map(); // userId -> simple state

io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) {
    socket.user = null;
    return next();
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.warn("invalid token:", err.message);
      socket.user = null;
      return next();
    }
    socket.user = {
      id: decoded.id,
      email: decoded.email,
      nickname: decoded.nickname,
    };
    next();
  });
});

io.on("connection", (socket) => {
  console.log("socket connected", socket.id, socket.user);

  socket.emit("connected");

  if (socket.user) {
    const userId = socket.user.id;

    // 간단 월드 위치
    let me = players.get(userId);
    if (!me) {
      me = {
        id: userId,
        nickname: socket.user.nickname,
        x: 200 + Math.random() * 100,
        y: 200 + Math.random() * 100,
        dir: "down",
      };
      players.set(userId, me);
    }

    const allPlayers = Array.from(players.values());
    const worldState = {};

    const userProgress = progression.getUserProgress(userId);
    const inventory = progression.getInventory(userId);

    socket.join("world");
    socket.emit("initState", {
      self: me,
      players: allPlayers,
      worldState,
      userProgress,
      inventory,
    });

    socket.to("world").emit("playerJoined", me);
  }

  socket.on("move", (data) => {
    if (!socket.user) return;
    const me = players.get(socket.user.id);
    if (!me) return;
    me.x = data.x ?? me.x;
    me.y = data.y ?? me.y;
    me.dir = data.dir ?? me.dir;
    socket.to("world").emit("stateUpdate", {
      players: [me],
      worldState: {},
    });
  });

  // ===== equipItem / storeItem 동기화 =====
  socket.on("equipItem", (payload, cb) => {
    if (!socket.user) return;
    const userId = socket.user.id;
    const { userItemId, slot } = payload || {};
    const result = progression.equipItem(userId, userItemId, slot);
    if (!result.ok) {
      cb && cb({ ok: false, message: result.message });
      return;
    }
    const progress = progression.getUserProgress(userId);
    socket.emit("inventoryUpdate", {
      inventory: result.inventory,
      progress,
      reason: "equip",
    });
    cb && cb({ ok: true });
  });

  socket.on("storeItem", (payload, cb) => {
    if (!socket.user) return;
    const userId = socket.user.id;
    const { userItemId } = payload || {};
    const result = progression.storeItem(userId, userItemId);
    if (!result.ok) {
      cb && cb({ ok: false, message: result.message });
      return;
    }
    const progress = progression.getUserProgress(userId);
    socket.emit("inventoryUpdate", {
      inventory: result.inventory,
      progress,
      reason: "store",
    });
    cb && cb({ ok: true });
  });

  socket.on("logout", () => {
    socket.disconnect(true);
  });

  socket.on("disconnect", () => {
    if (socket.user && players.has(socket.user.id)) {
      const me = players.get(socket.user.id);
      players.delete(socket.user.id);
      socket.to("world").emit("playerLeft", { id: me.id });
    }
    console.log("socket disconnected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`WonDieWorld inventory sync server on port ${PORT}`);
});
