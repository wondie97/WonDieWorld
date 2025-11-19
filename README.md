# WonDieWorld Multiplayer

동물의 숲 감성 + 소셜 + PVP + 레이드가 섞인 샌드박스 멀티플레이 게임 **WonDieWorld** 의 서버/클라이언트 기본 프로젝트입니다.

- Node.js + WebSocket + SQLite3
- 계정 시스템 (회원가입/로그인, bcrypt, JWT)
- 실시간 멀티플레이 (위치 동기화)
- 1vs1 PVP, 배틀존 기본 구조
- 8인 보스 레이드 기본 구조
- 길드 / 친구 / 우편 / 거래소 골격

> ⚠ 이 레포는 **엔진/구조 골격**에 초점이 맞춰져 있습니다.  
> 실제 그래픽/타일셋/사운드는 `client/assets` 에 여러분이 직접 넣어 사용하세요.

---

## 1. 폴더 구조

```txt
WonDieWorld/
│
├── server/
│   ├── server.js        # 메인 WebSocket 서버
│   ├── db.js            # SQLite 초기화
│   ├── auth.js          # 회원가입/로그인/JWT
│   ├── pvp.js           # 1vs1 / 배틀존
│   ├── raid.js          # 8인 레이드
│   ├── guild.js         # 길드 / 점령전
│   ├── friends.js       # 친구 / 우편
│   ├── market.js        # 거래소
│   └── db.sqlite        # SQLite DB 파일 (처음 실행 시 자동 생성)
│
├── client/
│   ├── index.html       # 클라이언트 엔트리
│   ├── main.js          # 메인 루프
│   ├── net.js           # WebSocket 연결
│   ├── world.js         # 월드/플레이어 그리기
│   ├── player.js        # Player 클래스
│   ├── ui.js            # UI 훅
│   └── assets/          # 이미지/사운드 등 리소스 폴더 (직접 채우기)
│
├── tests/
│   ├── server.test.js   # 서버 모듈 로딩 테스트
│   └── auth.test.js     # 인증 모듈 기본 테스트
│
├── package.json
├── .gitignore
└── README.md
