// main.js - WonDieWorld 캐릭터 애니메이션 (4방향 × 3프레임 걷기)
// 스프라이트 시트 구조:
//   - 전체: 4열 x 4행 (총 16칸)
//   - 열 0: DOWN, 열 1: LEFT, 열 2: RIGHT, 열 3: UP
//   - 행 0~2: 걷기 프레임 3개
//   - 행 3: 백팩/특수 포즈용 (지금은 사용 안 함)

(function () {
  const SPRITE_PATH = "img/char_wondie_01.png";
  const COLS = 4; // 방향 수
  const ROWS = 4; // 프레임 수

  const state = {
    canvas: null,
    ctx: null,
    running: false,
    lastTime: 0,
    keys: {},
    spriteImg: null,
    spriteLoaded: false,
    tileW: 64, // 실제는 이미지 로드 후 자동 계산
    tileH: 64,
    player: {
      x: 480,
      y: 270,
      w: 64,
      h: 64,
      speed: 200,
      dir: "down",       // "down" | "left" | "right" | "up"
      animState: "idle", // "idle" | "walk" | 미래: "fish_cast" 등
      frameIndex: 0,
      frameTime: 0,
      moving: false,
    },
  };

  // 각 애니메이션/방향별로 (row, col) 좌표 목록 정의
  const animations = {
    idle: {
      down:  { frames: [{ r: 0, c: 0 }], speed: 0.6 },
      left:  { frames: [{ r: 0, c: 1 }], speed: 0.6 },
      right: { frames: [{ r: 0, c: 2 }], speed: 0.6 },
      up:    { frames: [{ r: 0, c: 3 }], speed: 0.6 },
    },
    walk: {
      down: {
        frames: [
          { r: 0, c: 0 },
          { r: 1, c: 0 },
          { r: 2, c: 0 },
        ],
        speed: 0.12,
      },
      left: {
        frames: [
          { r: 0, c: 1 },
          { r: 1, c: 1 },
          { r: 2, c: 1 },
        ],
        speed: 0.12,
      },
      right: {
        frames: [
          { r: 0, c: 2 },
          { r: 1, c: 2 },
          { r: 2, c: 2 },
        ],
        speed: 0.12,
      },
      up: {
        frames: [
          { r: 0, c: 3 },
          { r: 1, c: 3 },
          { r: 2, c: 3 },
        ],
        speed: 0.12,
      },
    },
    // 나중에 낚시/백팩 포즈 등 추가:
    // fish_cast: { down:{frames:[{r:3,c:0}, ...], speed:0.1}, ... }
  };

  function loadSprite(path) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = path + "?v=" + Date.now(); // 캐시 무시
    });
  }

  async function init() {
    state.canvas = document.getElementById("gameCanvas");
    if (!state.canvas) return;
    state.ctx = state.canvas.getContext("2d");

    // 키 입력
    window.addEventListener("keydown", (e) => {
      state.keys[e.key] = true;
    });
    window.addEventListener("keyup", (e) => {
      state.keys[e.key] = false;
    });

    // 스프라이트 로드
    try {
      state.spriteImg = await loadSprite(SPRITE_PATH);
      state.spriteLoaded = true;

      state.tileW = state.spriteImg.width / COLS;
      state.tileH = state.spriteImg.height / ROWS;

      // 플레이어 표시 크기도 타일 크기에 맞춤
      state.player.w = state.tileW;
      state.player.h = state.tileH;

      console.log("Sprite loaded:", SPRITE_PATH, state.tileW, state.tileH);
    } catch (err) {
      console.error("Failed to load sprite:", err);
    }
  }

  async function start() {
    if (!state.ctx || !state.spriteLoaded) {
      await init();
    }
    if (!state.ctx || !state.spriteLoaded) return;
    if (state.running) return;

    state.running = true;
    state.lastTime = performance.now();
    requestAnimationFrame(loop);
  }

  function stop() {
    state.running = false;
  }

  function loop(timestamp) {
    if (!state.running) return;
    const dt = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(loop);
  }

  function update(dt) {
    const p = state.player;
    let vx = 0;
    let vy = 0;

    if (state.keys["ArrowLeft"] || state.keys["a"]) vx -= 1;
    if (state.keys["ArrowRight"] || state.keys["d"]) vx += 1;
    if (state.keys["ArrowUp"] || state.keys["w"]) vy -= 1;
    if (state.keys["ArrowDown"] || state.keys["s"]) vy += 1;

    p.moving = vx !== 0 || vy !== 0;

    if (p.moving) {
      // 방향 결정
      if (Math.abs(vx) > Math.abs(vy)) {
        p.dir = vx > 0 ? "right" : "left";
      } else {
        p.dir = vy > 0 ? "down" : "up";
      }

      const len = Math.hypot(vx, vy) || 1;
      vx /= len;
      vy /= len;

      p.x += vx * p.speed * dt;
      p.y += vy * p.speed * dt;

      p.animState = "walk";
    } else {
      p.animState = "idle";
    }

    // 캔버스 안으로 제한
    const halfW = p.w / 2;
    const halfH = p.h / 2;
    p.x = Math.max(halfW, Math.min(state.canvas.width - halfW, p.x));
    p.y = Math.max(halfH, Math.min(state.canvas.height - halfH, p.y));

    // 애니메이션 진행
    const anim = animations[p.animState][p.dir];
    if (!anim) return;

    p.frameTime += dt;
    const frameDuration = anim.speed;

    if (p.frameTime >= frameDuration) {
      p.frameTime -= frameDuration;
      p.frameIndex = (p.frameIndex + 1) % anim.frames.length;
    }
  }

  function render() {
    const ctx = state.ctx;
    const c = state.canvas;
    if (!ctx || !c || !state.spriteLoaded) return;

    ctx.clearRect(0, 0, c.width, c.height);

    const p = state.player;
    const img = state.spriteImg;
    const anim = animations[p.animState][p.dir];
    if (!anim) return;

    const frame = anim.frames[p.frameIndex];
    const frameW = state.tileW;
    const frameH = state.tileH;

    const sx = frame.c * frameW;
    const sy = frame.r * frameH;
    const sw = frameW;
    const sh = frameH;

    const dx = Math.round(p.x - p.w / 2);
    const dy = Math.round(p.y - p.h / 2);
    const dw = p.w;
    const dh = p.h;

    ctx.save();
    ctx.imageSmoothingEnabled = true; // 부드러운 일러 느낌
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
  }

  // 전역에서 호출할 수 있도록 노출
  window.gameMain = {
    start,
    stop,
  };
})();
