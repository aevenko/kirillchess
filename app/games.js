/* PGN viewer + light engine analysis (Stockfish in browser)
   Data source:
     - data/games/index.json (auto-generated)
     - data/games/*.pgn
*/

let board = null;
let chess = null;
let movesSan = [];
let moveIndex = 0;

let engine = null;
let engineEnabled = false;
let lastEngineFen = "";

function $(id){ return document.getElementById(id); }

function setStatus(text){
  const el = $("statusLine");
  if (el) el.textContent = text || "";
}

function safeText(x){ return (x === null || x === undefined || x === "") ? "—" : String(x); }

function formatGameTitle(g){
  const w = safeText(g.white);
  const b = safeText(g.black);
  const res = safeText(g.result);
  const ev = safeText(g.event);
  const dt = safeText(g.date || g.year);
  return `${w} vs ${b} • ${res} • ${ev} • ${dt}`;
}

async function fetchJSON(url){
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to load " + url);
  return await r.json();
}

async function fetchText(url){
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("Failed to load " + url);
  return await r.text();
}

function renderGamesList(games){
  const list = $("gamesList");
  list.innerHTML = "";

  games.forEach((g, i) => {
    const div = document.createElement("div");
    div.className = "game-item";
    div.dataset.index = String(i);

    const top = document.createElement("div");
    top.style.fontWeight = "600";
    top.textContent = `${safeText(g.white)} vs ${safeText(g.black)}`;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${safeText(g.result)} • ${safeText(g.event)} • ${safeText(g.date || g.year)}`;

    div.appendChild(top);
    div.appendChild(meta);

    div.addEventListener("click", async () => {
      document.querySelectorAll(".game-item").forEach(x => x.classList.remove("active"));
      div.classList.add("active");
      await loadGame(g);
    });

    list.appendChild(div);
  });
}

function renderMoves(){
  const ol = $("movesList");
  ol.innerHTML = "";

  for (let i=0; i<movesSan.length; i++){
    const li = document.createElement("li");
    li.textContent = movesSan[i];
    if (i === moveIndex - 1){
      li.style.fontWeight = "700";
      li.style.textDecoration = "underline";
    }
    li.addEventListener("click", () => {
      gotoMove(i+1);
    });
    ol.appendChild(li);
  }
}

function updateBoard(){
  if (!board || !chess) return;
  board.position(chess.fen());

  const hdr = $("gameHeader");
  if (hdr){
    const turn = chess.turn() === "w" ? "White to move" : "Black to move";
    hdr.textContent = `${turn} • Move ${Math.max(1, chess.moveNumber())}`;
  }

  setStatus(`Ход: ${moveIndex}/${movesSan.length} • FEN: ${chess.fen()}`);

  if (engineEnabled){
    runEngineForCurrentPosition();
  }
}

function gotoMove(n){
  if (!chess) return;
  if (n < 0) n = 0;
  if (n > movesSan.length) n = movesSan.length;

  chess.reset();
  moveIndex = 0;

  for (let i=0; i<n; i++){
    const ok = chess.move(movesSan[i], { sloppy: true });
    if (!ok) break;
    moveIndex++;
  }

  renderMoves();
  updateBoard();
}

function step(delta){
  gotoMove(moveIndex + delta);
}

function initBoard(){
  chess = new Chess();
  board = Chessboard("board", {
    position: "start",
    draggable: false
  });
  updateBoard();
}

function parsePGNToMoves(pgnText){
  const c = new Chess();
  const ok = c.load_pgn(pgnText, { sloppy: true });
  if (!ok){
    throw new Error("Не удалось прочитать PGN (проверь формат).");
  }
  return c.history(); // SAN list
}

function parsePGNTags(pgnText){
  const tags = {};
  const lines = pgnText.split(/\r?\n/);
  for (const line of lines){
    const t = line.trim();
    if (!t) break;
    const m = t.match(/^\[(\w+)\s+"(.*)"\]$/);
    if (m) tags[m[1]] = m[2];
  }
  return tags;
}

async function loadGame(g){
  $("engineBox").style.display = "none";
  $("engineOut").textContent = "—";
  lastEngineFen = "";

  const pgn = await fetchText(`/data/games/${g.file}`);
  const tags = parsePGNTags(pgn);

  movesSan = parsePGNToMoves(pgn);
  moveIndex = 0;

  // Reset position
  chess.reset();
  updateBoard();
  renderMoves();

  const w = tags.White || g.white || "White";
  const b = tags.Black || g.black || "Black";
  const res = tags.Result || g.result || "—";
  const ev = tags.Event || g.event || "—";
  const dt = tags.Date || g.date || g.year || "—";

  $("gameHeader").textContent = `${w} vs ${b} • ${res} • ${ev} • ${dt}`;
  setStatus(`Загружено: ${movesSan.length} ходов`);
}

function hookControls(){
  $("btnStart").addEventListener("click", () => gotoMove(0));
  $("btnPrev").addEventListener("click", () => step(-1));
  $("btnNext").addEventListener("click", () => step(1));
  $("btnEnd").addEventListener("click", () => gotoMove(movesSan.length));

  $("btnFlip").addEventListener("click", () => {
    if (board) board.flip();
  });

  $("btnEngine").addEventListener("click", () => {
    engineEnabled = !engineEnabled;
    $("engineBox").style.display = engineEnabled ? "block" : "none";
    if (engineEnabled){
      ensureEngine();
      runEngineForCurrentPosition(true);
    }
  });

  // Keyboard arrows
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
}

function ensureEngine(){
  if (engine) return;
  try{
    engine = Stockfish(); // from stockfish.js
    engine.onmessage = (event) => {
      const line = (typeof event === "string") ? event : event.data;
      if (!line) return;

      // show useful lines
      if (line.startsWith("info ")){
        // keep last few
        const out = $("engineOut");
        if (!out) return;
        out.textContent = line;
      }
      if (line.startsWith("bestmove")){
        // done
      }
    };
    engine.postMessage("uci");
    engine.postMessage("setoption name Threads value 2");
  } catch (e){
    $("engineOut").textContent = "Engine не загрузился в браузере (проверь, что CDN доступен).";
  }
}

function runEngineForCurrentPosition(force=false){
  if (!engineEnabled || !engine || !chess) return;
  const fen = chess.fen();
  if (!force && fen === lastEngineFen) return;
  lastEngineFen = fen;

  $("engineOut").textContent = "Думаю…";
  engine.postMessage("ucinewgame");
  engine.postMessage("position fen " + fen);
  // short analysis (fast)
  engine.postMessage("go depth 14");
}

async function main(){
  initBoard();
  hookControls();

  // Load index
  let games = [];
  try{
    games = await fetchJSON("/data/games/index.json");
  } catch (e){
    $("gamesList").innerHTML = '<div class="meta">Пока нет базы партий. Добавь .pgn в <code>data/games/</code> и запусти генератор index.json.</div>';
    return;
  }

  if (!Array.isArray(games) || games.length === 0){
    $("gamesList").innerHTML = '<div class="meta">Пока нет партий. Добавь .pgn в <code>data/games/</code>.</div>';
    return;
  }

  renderGamesList(games);

  // auto-load first game
  const first = games[0];
  const firstEl = document.querySelector(".game-item");
  if (firstEl) firstEl.classList.add("active");
  await loadGame(first);
}

document.addEventListener("DOMContentLoaded", main);
