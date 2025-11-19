let socket = null;
let connected = false;

function connectToServer() {
    const host = window.location.hostname;
    const url = location.protocol === "https:"
        ? `wss://${host}`
        : `ws://${host}:3000`;

    socket = new WebSocket(url);

    socket.onopen = () => {
        connected = true;
        console.log("WS Connected:", url);
    };

    socket.onmessage = (msg) => {
        handleNet(JSON.parse(msg.data));
    };

    socket.onclose = () => {
        console.log("WS Closed. Reconnecting in 3s...");
        connected = false;
        setTimeout(connectToServer, 3000);
    };
}

function sendToServer(data) {
    if (!connected) return;
    socket.send(JSON.stringify(data));
}
