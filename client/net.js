
// client/net.js
// Socket.io 클라이언트 래퍼 (equip/store 동기화 포함)

const net = (() => {
  let socket = null;
  const handlers = {};

  function init() {
    if (socket) return;
    const token = localStorage.getItem("wondie_token") || "";
    // eslint-disable-next-line no-undef
    socket = io({ auth: { token } });

    socket.on("connect", () => emitLocal("connected"));
    socket.on("disconnect", () => emitLocal("disconnected"));

    const events = [
      "connected",
      "initState",
      "playerJoined",
      "playerLeft",
      "stateUpdate",
      "inventoryUpdate",
    ];

    events.forEach((ev) => {
      socket.on(ev, (payload) => emitLocal(ev, payload));
    });
  }

  function reconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    init();
  }

  function on(event, fn) {
    if (!handlers[event]) handlers[event] = [];
    handlers[event].push(fn);
  }

  function emitLocal(event, payload) {
    if (!handlers[event]) return;
    handlers[event].forEach((fn) => fn(payload));
  }

  function emit(event, payload, cb) {
    if (!socket || !socket.connected) return;
    socket.emit(event, payload, cb);
  }

  return {
    init,
    reconnect,
    on,
    emit,
  };
})();
