// client/ui.js

const ui = (() => {
  let gameRef = null;
  let changeSceneRef = null;
  let requestPvpMatchRef = null;
  let requestRaidEnterRef = null;
  let logoutRef = null;

  function $(id) {
    return document.getElementById(id);
  }

  function init({ game, changeScene, requestPvpMatch, requestRaidEnter, logout }) {
    gameRef = game;
    changeSceneRef = changeScene;
    requestPvpMatchRef = requestPvpMatch;
    requestRaidEnterRef = requestRaidEnter;
    logoutRef = logout;

    bindLoginForm();
    bindTopButtons();

    // 첫 진입 시 토큰이 있으면 바로 소켓 연결
    net.init();
  }

  function bindLoginForm() {
    const loginSection = $("loginSection");
    const lobbySection = $("lobbySection");

    const loginForm = $("loginForm");
    const loginEmail = $("loginEmail");
    const loginPassword = $("loginPassword");

    const registerForm = $("registerForm");
    const regEmail = $("regEmail");
    const regPassword = $("regPassword");
    const regNickname = $("regNickname");

    const btnShowRegister = $("btnShowRegister");
    const btnShowLogin = $("btnShowLogin");
    const btnLogout = $("btnLogout");

    // 로그인 / 회원가입 폼 토글
    if (btnShowRegister) {
      btnShowRegister.onclick = () => {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
      };
    }
    if (btnShowLogin) {
      btnShowLogin.onclick = () => {
        registerForm.style.display = "none";
        loginForm.style.display = "block";
      };
    }

    // 로그인
    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();
        if (!email || !password) {
          alert("이메일과 비밀번호를 입력해주세요.");
          return;
        }

        try {
          const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!data.ok) {
            alert(data.message || "로그인에 실패했습니다.");
            return;
          }

          localStorage.setItem("wondie_token", data.token);
          // UI 갱신
          $("currentNickname").textContent = data.user.nickname;
          loginSection.style.display = "none";
          lobbySection.style.display = "block";

          // 소켓 재연결 (새 토큰 적용)
          net.reconnect();
        } catch (err) {
          console.error(err);
          alert("로그인 중 오류가 발생했습니다.");
        }
      };
    }

    // 회원가입
    if (registerForm) {
      registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = regEmail.value.trim();
        const password = regPassword.value.trim();
        const nickname = regNickname.value.trim();

        if (!email || !password || !nickname) {
          alert("모든 항목을 입력해주세요.");
          return;
        }

        try {
          const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, nickname }),
          });
          const data = await res.json();
          if (!data.ok) {
            alert(data.message || "회원가입에 실패했습니다.");
            return;
          }

          alert("회원가입 성공! 자동으로 로그인됩니다.");

          localStorage.setItem("wondie_token", data.token);
          $("currentNickname").textContent = data.user.nickname;
          loginSection.style.display = "none";
          lobbySection.style.display = "block";

          net.reconnect();
        } catch (err) {
          console.error(err);
          alert("회원가입 중 오류가 발생했습니다.");
        }
      };
    }

    // 로그아웃
    if (btnLogout) {
      btnLogout.onclick = () => {
        localStorage.removeItem("wondie_token");
        if (logoutRef) logoutRef();
        loginSection.style.display = "block";
        lobbySection.style.display = "none";
      };
    }
  }

  function bindTopButtons() {
    const btnWorld = $("btnWorld");
    const btnPvp = $("btnPvp");
    const btnRaid = $("btnRaid");

    if (btnWorld) {
      btnWorld.onclick = () => {
        if (changeSceneRef) changeSceneRef("WORLD");
      };
    }
    if (btnPvp) {
      btnPvp.onclick = () => {
        if (requestPvpMatchRef) requestPvpMatchRef();
      };
    }
    if (btnRaid) {
      btnRaid.onclick = () => {
        if (requestRaidEnterRef) requestRaidEnterRef("raid-1");
      };
    }
  }

  // main.js 에서 씬 변경 시 호출
function onSceneChange(scene, game) {
  const lobbySection = $("lobbySection");
  const loginSection = $("loginSection");
  const lvlLabel = $("userLevelInfo");
  const goldLabel = $("userGoldInfo");

  if (scene === "LOGIN") {
    loginSection.style.display = "block";
    lobbySection.style.display = "none";
  } else if (scene === "LOBBY" || scene === "WORLD" || scene === "PVP" || scene === "RAID") {
    loginSection.style.display = "none";
    lobbySection.style.display = "block";

    // 🔥 현재 레벨/재화 표시
    if (game.me && game.me.progress) {
      const p = game.me.progress;
      if (lvlLabel) {
        lvlLabel.textContent = ` | LV.${p.level} (${p.exp}/${p.expToNext})`;
      }
      if (goldLabel) {
        goldLabel.textContent = ` | Gold: ${p.gold} / Gem: ${p.gem}`;
      }
      const nickSpan = $("currentNickname");
      if (nickSpan) nickSpan.textContent = game.me.nickname;
    }
  }
}


  return {
    init,
    onSceneChange,
  };
})();
