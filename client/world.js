// 월드 & 플레이어 & 간단한 게임 상태

const players = {};      // { id: Player }
let myId = null;

// ─────────────────────────────
// 게임 상태(낚시, 상점, 집, 펫 전투)
// client/world.js
// 월드 & 플레이어 & 간단한 게임 상태

const players = {};      // { id: Player }
let myId = null;

// ─────────────────────────────
// 게임 상태(낚시, 상점, 집, 펫 전투)
// ─────────────────────────────

const gameState = {
    gold: 1000,
    inventory: [], // { type: 'fish' | 'item', name, qty }
    fishingLog: [],
    currentRoom: 1,  // 1~4
    rooms: {
        1: ["나무 침대", "작은 탁자"],
        2: [],
        3: [],
        4: []
    },
    shopOpen: false,
    petBattleOpen: false,
    fishingOpen: false,
    lastMessage: "",
    pet: {
        name: "꼬마 늑대",
        hp: 100,
        maxHp: 100
    },
    enemy: {
        name: "연습 허수아비",
        hp: 150,
        maxHp: 150
    }
};

// 낚시용 테이블
const FISH_TABLE = [
    { name: "블루길",  chance: 40, price: 20 },
    { name: "송어",    chance: 30, price: 35 },
    { name: "농어",    chance: 20, price: 60 },
    { name: "황금 상어", chance: 10, price: 200 },
];

// 상점 아이템
const SHOP_ITEMS = [
    { id: 1, name: "작은 가구 상자", price: 100, roomItem: "작은 화분" },
    { id: 2, name: "침대 상자",     price: 200, roomItem: "포근한 침대" },
    { id: 3, name: "책상 상자",     price: 150, roomItem: "작은 책상" },
    { id: 4, name: "벽장식 상자",   price: 120, roomItem: "벽 장식 액자" },
    { id: 5, name: "펫 간식",       price: 80,  petHeal: 30 },
];

// ─────────────────────────────
// 인벤토리 유틸
// ─────────────────────────────

function addToInventory(item) {
    const found = gameState.inventory.find(i => i.type === item.type && i.name === item.name);
    if (found) found.qty += item.qty;
    else gameState.inventory.push({ ...item });
}

// ─────────────────────────────
// 월드 업데이트 & 렌더
// ─────────────────────────────

function updateWorld(delta) {
    // 나중에 맵, 애니메이션 등 추가
}

function drawWorld(ctx) {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    // 배경 하늘
    ctx.fillStyle = "#aee6ff";
    ctx.fillRect(0, 0, w, h);

    // ==== 물가 영역(예: 화면 아래 30%) ====
    const waterTop = h * 0.7;   // 여기 기준으로 아래쪽이 물
    ctx.fillStyle = "#4fb3ff";
    ctx.fillRect(0, waterTop, w, h - waterTop);

    // 물과 땅 경계선 살짝
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillRect(0, waterTop - 4, w, 4);

    // 플레이어들 렌더
    Object.values(players).forEach(p => p.draw(ctx));
}
