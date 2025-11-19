
// client/inventoryOverlay.js
// 캔버스 위 오버레이 인벤토리 UI

const InventoryOverlay = (() => {
  let rootEl;
  let detailNameEl;
  let detailDescEl;
  let slotEls;
  let tabEls;
  let equipBtn;
  let storeBtn;

  let inventoryData = [];
  let selectedUserItemId = null;
  let currentCategory = "tool";

  function init() {
    rootEl = document.getElementById("inventoryOverlay");
    if (!rootEl) return;

    detailNameEl = document.getElementById("invDetailName");
    detailDescEl = document.getElementById("invDetailDesc");
    equipBtn = document.getElementById("invBtnEquip");
    storeBtn = document.getElementById("invBtnStore");
    slotEls = rootEl.querySelectorAll(".slot");
    tabEls = rootEl.querySelectorAll(".tab");

    slotEls.forEach((el) => {
      el.addEventListener("click", () => {
        const slotIndex = parseInt(el.dataset.slot, 10);
        selectBySlot(slotIndex);
      });
    });

    tabEls.forEach((el) => {
      el.addEventListener("click", () => {
        currentCategory = el.dataset.category;
        tabEls.forEach((t) => t.classList.remove("active"));
        el.classList.add("active");
        renderSlots();
      });
    });

    equipBtn.addEventListener("click", () => {
      if (!selectedUserItemId) return;
      net.emit(
        "equipItem",
        { userItemId: selectedUserItemId, slot: null },
        (res) => {
          if (!res || !res.ok) {
            alert(res?.message || "장비 실패");
          }
        }
      );
    });

    storeBtn.addEventListener("click", () => {
      if (!selectedUserItemId) return;
      net.emit("storeItem", { userItemId: selectedUserItemId }, (res) => {
        if (!res || !res.ok) {
          alert(res?.message || "보관 실패");
        }
      });
    });
  }

  function setInventory(list) {
    inventoryData = list || [];
    selectedUserItemId = null;
    renderSlots();
    detailNameEl.textContent = "아이템을 선택해 주세요";
    detailDescEl.textContent =
      "슬롯을 클릭하면\n여기에 설명이 표시됩니다.";
  }

  function renderSlots() {
    slotEls.forEach((el) => {
      el.classList.remove("selected");
      const idx = parseInt(el.dataset.slot, 10);
      const item = inventoryData.find((it) => it.slot === idx);
      if (!item) {
        el.style.opacity = 0.15;
        return;
      }
      if (
        currentCategory === "etc" ||
        !item.category ||
        item.category === currentCategory
      ) {
        el.style.opacity = 1;
      } else {
        el.style.opacity = 0.35;
      }
    });
  }

  function selectBySlot(slotIndex) {
    const item = inventoryData.find((it) => it.slot === slotIndex);
    slotEls.forEach((el) => el.classList.remove("selected"));

    const el = [...slotEls].find(
      (s) => parseInt(s.dataset.slot, 10) === slotIndex
    );
    if (el) el.classList.add("selected");

    if (!item) {
      detailNameEl.textContent = "빈 슬롯";
      detailDescEl.textContent = "아이템이 없습니다.";
      selectedUserItemId = null;
      return;
    }
    selectedUserItemId = item.userItemId;
    detailNameEl.textContent = item.name;
    detailDescEl.textContent = item.description || "";
  }

  function show() {
    if (!rootEl) return;
    rootEl.classList.remove("hidden");
    rootEl.classList.add("visible");
  }

  function hide() {
    if (!rootEl) return;
    rootEl.classList.remove("visible");
    rootEl.classList.add("hidden");
  }

  function toggle() {
    if (!rootEl) return;
    if (rootEl.classList.contains("visible")) hide();
    else show();
  }

  return {
    init,
    setInventory,
    show,
    hide,
    toggle,
  };
})();
