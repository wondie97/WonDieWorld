const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let lastTime = 0;

function gameLoop(time) {
    const delta = time - lastTime;
    lastTime = time;

    updateWorld(delta);
    drawWorld(ctx);
    uiDraw(ctx);

    requestAnimationFrame(gameLoop);
}

// 네트워크 이벤트 처리
function handleNet(msg) {
    if (msg.type === "login_ok") {
        myId = msg.userId;
        document.getElementById("loading").style.display = "none";
    }

    if (msg.type === "player_move") {
        let p = players[msg.userId];
        if (!p) p = players[msg.userId] = new Player(msg.userId);

        p.x = msg.x;
        p.y = msg.y;
        p.dir = msg.dir;
    }
}

connectToServer();
requestAnimationFrame(gameLoop);

// 키 입력 처리 → 서버로 전송
document.addEventListener("keydown", (e) => {
    if (!myId) return;

    const p = players[myId] || (players[myId] = new Player(myId));
    const speed = 3;

    if (e.key === "ArrowUp")    { p.y -= speed; p.dir="up"; }
    if (e.key === "ArrowDown")  { p.y += speed; p.dir="down"; }
    if (e.key === "ArrowLeft")  { p.x -= speed; p.dir="left"; }
    if (e.key === "ArrowRight") { p.x += speed; p.dir="right"; }

    sendToServer({
        type: "move",
        x: p.x,
        y: p.y,
        dir: p.dir
    });
});
