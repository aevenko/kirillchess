let board=null, game=null, orientation='white';
let currentMoves=[], currentFens=[], currentHeaders={}, plyIndex=0;
let engineOn=false, engineWorker=null;

const el=id=>document.getElementById(id);

async function fetchJSON(url){ const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(r.status); return r.json(); }
async function fetchText(url){ const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(r.status); return r.text(); }

function esc(s){ return (s??'').toString().replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function safe(s){ return (s??'').toString().trim(); }

function buildTitle(g){
  const w=safe(g.white)||'White', b=safe(g.black)||'Black', res=safe(g.result)||'';
  const date=(safe(g.date) && g.date!=='????.??.??')?g.date:'';
  const ev=(safe(g.event) && g.event!=='?')?g.event:'';
  return [ `${w} vs ${b}${res?('  '+res):''}`, ev, date ].filter(Boolean).join(' • ');
}

function initBoard(){
  if(board) return;
  board = Chessboard('board', { position:'start', orientation });
}

function extractHeaders(pgn){
  const h={};
  for(const line of pgn.split(/\r?\n/)){
    if(line.startsWith('[')){
      const m=line.match(/\[(\w+)\s+\"(.*)\"\]/);
      if(m) h[m[1]]=m[2];
    }
  }
  return h;
}

function buildMeta(h){
  const ev=safe(h.Event), site=safe(h.Site), date=safe(h.Date), rnd=safe(h.Round);
  const eco=safe(h.ECO), op=safe(h.Opening);
  const w=safe(h.White), b=safe(h.Black), res=safe(h.Result);
  const wE=safe(h.WhiteElo)||safe(h.WhiteELO), bE=safe(h.BlackElo)||safe(h.BlackELO);
  const lines=[];
  const l1=[ev, site, (date && date!=='????.??.??')?date:'', (rnd && rnd!=='?')?('Round '+rnd):'' ].filter(Boolean).join(' • ');
  if(l1) lines.push(l1);
  const l2=[`${w}${wE?(' ('+wE+')'):''}`, 'vs', `${b}${bE?(' ('+bE+')'):''}`, res].filter(Boolean).join(' ');
  if(l2.trim()) lines.push(l2);
  const l3=[eco?('ECO '+eco):'', op].filter(Boolean).join(' • ');
  if(l3) lines.push(l3);
  return lines.join('<br>');
}

function buildFensFromPgn(pgn){
  game=new Chess();
  game.load_pgn(pgn, {sloppy:true});
  const hist=game.history({verbose:true});
  const g2=new Chess();
  currentFens=['start']; currentMoves=[];
  for(const mv of hist){
    g2.move(mv);
    currentMoves.push(mv.san);
    currentFens.push(g2.fen());
  }
}

function renderMoves(){
  const box=el('moves'); box.innerHTML='';
  const start=document.createElement('div');
  start.className='moveRow';
  start.innerHTML=`<span data-ply="0" style="opacity:.85;">Start position</span>`;
  start.querySelector('span').onclick=()=>setPly(0);
  box.appendChild(start);

  for(let i=0;i<currentMoves.length;i+=2){
    const moveNo=(i/2)+1;
    const w=currentMoves[i]||'', b=currentMoves[i+1]||'';
    const row=document.createElement('div');
    row.className='moveRow';
    row.innerHTML = `<span style="opacity:.7;min-width:32px;">${moveNo}.</span>
      <span data-ply="${i+1}">${esc(w)}</span>
      <span data-ply="${i+2}">${esc(b)}</span>`;
    row.querySelectorAll('span[data-ply]').forEach(s=>{
      s.onclick=()=>setPly(parseInt(s.dataset.ply,10));
    });
    box.appendChild(row);
  }
}

function highlight(){
  document.querySelectorAll('#moves span[data-ply]').forEach(s=>s.classList.remove('active'));
  const a=document.querySelector(`#moves span[data-ply="${plyIndex}"]`);
  if(a) a.classList.add('active');
}

function setPly(i){
  plyIndex=Math.max(0, Math.min(i, currentFens.length-1));
  const fen = (plyIndex===0)?'start':currentFens[plyIndex];
  board.position(fen==='start'?'start':fen,false);
  highlight();
  if(engineOn) requestEval();
}

async function loadGame(file){
  initBoard();
  el('engineEval').textContent='—'; el('enginePV').textContent='';
  const pgn=await fetchText(file);
  currentHeaders=extractHeaders(pgn);
  buildFensFromPgn(pgn);
  el('pgnMeta').innerHTML = buildMeta(currentHeaders) || esc(file.split('/').pop());
  renderMoves();
  // orientation
  const w=(currentHeaders.White||'').toLowerCase(), b=(currentHeaders.Black||'').toLowerCase();
  if(w.includes('kirill')) orientation='white';
  else if(b.includes('kirill')) orientation='black';
  board.orientation(orientation);
  setPly(0);
}

function renderList(games){
  const list=el('gameList'); list.innerHTML='';
  for(const g of games){
    const d=document.createElement('div');
    d.className='gameItem';
    d.innerHTML=`<div class="gameTitle">${esc(buildTitle(g))}</div>
      <div class="gameMeta">${esc((g.opening && g.opening!=='?')?g.opening:(g.eco?('ECO '+g.eco):''))}</div>`;
    d.onclick=()=>loadGame(g.file);
    list.appendChild(d);
  }
}

function wire(){
  el('btnStart').onclick=()=>setPly(0);
  el('btnPrev').onclick=()=>setPly(plyIndex-1);
  el('btnNext').onclick=()=>setPly(plyIndex+1);
  el('btnEnd').onclick=()=>setPly(currentFens.length-1);
  el('btnFlip').onclick=()=>{ orientation=(orientation==='white')?'black':'white'; board.orientation(orientation); };

  el('btnEngine').onclick=()=>{
    engineOn=!engineOn;
    el('btnEngine').textContent = engineOn ? 'Engine: ON' : 'Engine: OFF';
    if(engineOn){ startEngine(); requestEval(); }
    else { stopEngine(); el('engineEval').textContent='—'; el('enginePV').textContent=''; }
  };

  el('search').addEventListener('input', async (e)=>{
    const q=e.target.value.toLowerCase().trim();
    const idx=await fetchJSON('/data/games_index.json');
    renderList(idx.games.filter(g => (`${g.white} ${g.black} ${g.event} ${g.opening} ${g.eco} ${g.date}`).toLowerCase().includes(q)));
  });
}

function startEngine(){
  if(engineWorker) return;
  const workerCode = `
    let sf=null;
    self.onmessage=(e)=>{
      const m=e.data;
      if(m && m.type==='init'){
        importScripts('https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish.js');
        sf=Stockfish();
        sf.onmessage=(line)=>self.postMessage({type:'line', line});
        sf.postMessage('uci');
        return;
      }
      if(!sf) return;
      if(m && m.type==='cmd') sf.postMessage(m.cmd);
    };
  `;
  const blob=new Blob([workerCode],{type:'application/javascript'});
  const url=URL.createObjectURL(blob);
  engineWorker=new Worker(url);
  engineWorker.onmessage=onEngineLine;
  engineWorker.postMessage({type:'init'});
}

function stopEngine(){ if(engineWorker){ engineWorker.terminate(); engineWorker=null; } }

function requestEval(){
  if(!engineWorker) return;
  engineWorker.postMessage({type:'cmd', cmd:'stop'});
  if(plyIndex===0) engineWorker.postMessage({type:'cmd', cmd:'position startpos'});
  else engineWorker.postMessage({type:'cmd', cmd:'position fen '+currentFens[plyIndex]});
  engineWorker.postMessage({type:'cmd', cmd:'go depth 14'});
}

function onEngineLine(e){
  const line=(e.data && e.data.type==='line') ? (e.data.line||'') : '';
  if(!line.startsWith('info') || !line.includes(' pv ')) return;
  const mcp=line.match(/score\s+cp\s+(-?\d+)/);
  const mm=line.match(/score\s+mate\s+(-?\d+)/);
  let evalTxt='';
  if(mm) evalTxt='Mate '+mm[1];
  else if(mcp){ const cp=parseInt(mcp[1],10); evalTxt=(cp>=0?'+':'')+(cp/100).toFixed(2); }
  else return;
  const pv=line.split(' pv ')[1].trim().split(/\s+/).slice(0,10).join(' ');
  el('engineEval').textContent=evalTxt;
  el('enginePV').textContent=pv?('PV: '+pv):'';
}

async function main(){
  wire();
  try{
    const idx=await fetchJSON('/data/games_index.json');
    renderList(idx.games);
  }catch(err){
    el('gameList').innerHTML='<div class="hint">Не нашёл /data/games_index.json. Проверь, что файл загружен.</div>';
  }
}
document.addEventListener('DOMContentLoaded', main);
