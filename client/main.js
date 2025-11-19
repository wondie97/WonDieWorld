
// client/main.js
// WonDieWorld 간단 메인 루프 + 인벤토리 연동 예시

const SCENE = {
  LOADING: "LOADING",
  WORLD: "WORLD",
};

const game = {
  scene: SCENE.LOADING,
  me: null,
  players: {},
};

function calcStats(player) {
  const baseAttack = player.baseAttack || 5;
  const baseDefense = player.baseDefense || 2;
  let attack = baseAttack;
  let defense = baseDefense;

  const eq = player.equipment || {};
  Object.values(eq).forEach((item) => {
    if (!item) return;
    attack += item.attack || 0;
    defense += item.defense || 0;
  });

  return { attack, defense };
}

function changeScene(scene) {
  game.scene = scene;
}

function init() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  InventoryOverlay.init();
  net.init();

  net.on("initState", (payload) => {
    const { self, inventory } = payload;

    game.me = {
      id: self.id,
      nickname: self.nickname,
      x: self.x,
      y: self.y,
      dir: self.dir,
      baseAttack: 5,
      baseDefense: 2,
      equipment: {
        head: null,
        body: null,
        legs: null,
        tool: null,
      },
      stats: { attack: 5, defense: 2 },
    };

    // 서버에서 내려온 인벤토리 → 클라 포맷
    game.me.inventory = (inventory || []).map((it, idx) => ({
      userItemId: it.userItemId,
      name: it.name,
      description: it.description || "",
      attack: it.attack || 0,
      defense: it.defense || 0,
      slot: idx, // 여기선 단순 매핑
      category: it.type || "etc",
      equipSlot: it.equipSlot || "tool",
    }));

    game.me.stats = calcStats(game.me);
    InventoryOverlay.setInventory(game.me.inventory);

    changeScene(SCENE.WORLD);
  });

  net.on("inventoryUpdate", (payload) => {
    const { inventory } = payload;
    if (!game.me) return;

    game.me.inventory = (inventory || []).map((it, idx) => ({
      userItemId: it.userItemId,
      name: it.name,
      description: it.description || "",
      attack: it.attack || 0,
      defense: it.defense || 0,
      slot: idx,
      category: it.type || "etc",
      equipSlot: it.equipSlot || "tool",
    }));

    // 장착된 아이템 반영
    game.me.equipment = {
      head: null,
      body: null,
      legs: null,
      tool: null,
    };
    inventory.forEach((it) => {
      if (it.equippedSlot) {
        game.me.equipment[it.equippedSlot] = {
          name: it.name,
          attack: it.attack,
          defense: it.defense,
        };
      }
    });

    game.me.stats = calcStats(game.me);
    InventoryOverlay.setInventory(game.me.inventory);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "i" || e.key === "I") {
      InventoryOverlay.toggle();
    }
  });

  function loop() {
    requestAnimationFrame(loop);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (game.scene === SCENE.WORLD && game.me) {
      ctx.fillStyle = "#8fc9ff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#333";
      ctx.fillText(
        `${game.me.nickname} ATK:${game.me.stats.attack} DEF:${game.me.stats.defense}`,
        20,
        30
      );
    }
  }

  loop();
}

window.addEventListener("load", init);
