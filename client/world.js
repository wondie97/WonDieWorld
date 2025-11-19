const players = {};      // { id: Player }

let myId = null;

function updateWorld(delta) {
    // 나중에 맵/카메라 구현 시 확장
}

function drawWorld(ctx) {
    ctx.fillStyle = "#aee6ff";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // 모든 플레이어 그리기
    Object.values(players).forEach(p => p.draw(ctx));
}
