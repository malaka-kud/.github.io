const grid = document.getElementById("grid");
const trash = document.getElementById("trash");
const result = document.getElementById("result");
const palette = document.getElementById("palette");

const GRID_ROWS = 5;
const GRID_COLS = 6;

const PANELS = {
  I: [[0,0],[0,1],[0,2],[0,3]],
  O: [[0,0],[1,0],[0,1],[1,1]],
  L: [[0,0],[1,0],[2,0],[2,1]],
  S: [[0,0],[1,0],[1,1],[2,1]],
  V: [[0,0],[1,0],[1,1]]
};

let dragPanelType = null;
let dragPanelId = null;
let nextPanelId = 1;

// スマホ用選択中パネル
let selectedPanelId = null;   // 例: "p1" や "palette_I"
let selectedPanelType = null; // 例: "I"

// 完成不能パネルIDのセット（renderStateに渡すため）
let impossiblePanelIds = [];

const state = Array.from({length: GRID_ROWS}, () => Array(GRID_COLS).fill(null));

// --- グリッド初期化 ---
function createGrid(){
  grid.innerHTML = "";
  for(let r=0; r<GRID_ROWS; r++){
    for(let c=0; c<GRID_COLS; c++){
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      // PCドラッグ移動対応
      cell.addEventListener("dragover", e => e.preventDefault());
      cell.addEventListener("drop", e => {
        e.preventDefault();
        if(!dragPanelType) return;

        // 移動の場合は一度移動元クリア
        if(dragPanelId) movePanel(dragPanelId);

        placePanel(dragPanelType, r, c, dragPanelId || `p${nextPanelId++}`);

        dragPanelId = null;
        dragPanelType = null;
        clearSelection();
      });

      // グリッド上パネルのドラッグ開始（ここでdragPanelId設定）
      cell.addEventListener("dragstart", e => {
        const val = state[r][c];
        if(val){
          dragPanelType = val.type;
          dragPanelId = val.id;
          // 盤面上のパネルドラッグ中は選択解除
          clearSelection();
        }
      });

      // スマホ・クリックで選択・配置（タッチの代替）
      cell.addEventListener("click", () => {
        const val = state[r][c];
        if(selectedPanelId === null){
          if(val){
            // 盤面のパネルを選択（移動モード）
            selectedPanelId = val.id;
            selectedPanelType = val.type;
            highlightSelectedPanel();
          }
        } else {
          // 置く処理
          if(selectedPanelId.startsWith("palette_")){
            // パレット由来のパネル新規配置
            if(canPlacePanelAt(selectedPanelType, r, c, null)){
              placePanel(selectedPanelType, r, c, `p${nextPanelId++}`);
            }
            clearSelection();
          } else {
            // 既存盤面パネル移動モード
            if(canPlacePanelAt(selectedPanelType, r, c, selectedPanelId)){
              movePanel(selectedPanelId);
              placePanel(selectedPanelType, r, c, selectedPanelId);
            }
            clearSelection();
          }
        }
      });

      grid.appendChild(cell);
    }
  }
  renderState();
}

// --- パレット初期化 ---
function createPalette(){
  palette.innerHTML = "";
  for(const type in PANELS){
    const btn = document.createElement("div");
    btn.className = "panel " + type;
    btn.textContent = type;
    btn.draggable = true;
    btn.dataset.type = type;

    // パレットのパネルをドラッグ開始したら typeセット
    btn.addEventListener("dragstart", e => {
      dragPanelType = e.target.dataset.type;
      dragPanelId = null;
      clearSelection();
    });

    // タッチで選択（スマホ用）
    btn.addEventListener("click", () => {
      if(selectedPanelId === `palette_${type}`){
        clearSelection();
        return;
      }
      selectedPanelId = `palette_${type}`;
      selectedPanelType = type;
      highlightSelectedPanel();
    });

    palette.appendChild(btn);
  }
}

// --- 盤面にパネルを置けるか判定 ---
function canPlacePanelAt(type, row, col, panelId){
  const shape = PANELS[type];
  if(!shape.every(([dr,dc])=>{
    const r = row+dr;
    const c = col+dc;
    return r>=0 && r<GRID_ROWS && c>=0 && c<GRID_COLS;
  })) return false;

  return shape.every(([dr,dc])=>{
    const r = row+dr;
    const c = col+dc;
    const cell = state[r][c];
    return cell === null || cell.id === panelId;
  });
}

// --- 盤面上のパネルを消す ---
function movePanel(panelId){
  for(let r=0; r<GRID_ROWS; r++){
    for(let c=0; c<GRID_COLS; c++){
      if(state[r][c]?.id === panelId){
        state[r][c] = null;
      }
    }
  }
}

// --- 盤面にパネルを配置 ---
function placePanel(type, baseRow, baseCol, panelId){
  if(!canPlacePanelAt(type, baseRow, baseCol, panelId)) return;
  const shape = PANELS[type];
  shape.forEach(([dr,dc])=>{
    const r = baseRow+dr;
    const c = baseCol+dc;
    state[r][c] = {type, id: panelId};
  });
  renderState(impossiblePanelIds);
}

// --- 画面表示更新 ---
function renderState(highlightIds=[]){
  const highlightSet = new Set(highlightIds);

  document.querySelectorAll(".cell").forEach(cell=>{
    const r = +cell.dataset.row;
    const c = +cell.dataset.col;
    const val = state[r][c];

    cell.textContent = val?.type || "";
    cell.className = "cell";
    if(val) cell.classList.add(val.type);

    // 完成不能パネル明るく（CSSクラス）
    if(val && highlightSet.has(val.id)){
      cell.classList.add("highlight");
    } else {
      cell.classList.remove("highlight");
    }

    // 選択中パネルは完成不能パネルと同じ見た目にする（highlight + brightness）
    if(val && (val.id === selectedPanelId)){
      cell.classList.add("highlight");
      cell.style.filter = "brightness(1.5)";
    }
    // 完成不能パネルはfilter明るくも付ける
    else if(val && highlightSet.has(val.id)){
      cell.style.filter = "brightness(1.5)";
    }
    else {
      cell.style.filter = "";
    }

    // ドラッグ可能設定
    if(val){
      cell.draggable = true;
      cell.ondragstart = e => {
        dragPanelType = val.type;
        dragPanelId = val.id;
        clearSelection();
      };
    } else {
      cell.draggable = false;
      cell.ondragstart = null;
    }
  });

  // パレットのハイライト
  document.querySelectorAll(".panel").forEach(panel=>{
    if(selectedPanelId === `palette_${panel.dataset.type}` || selectedPanelType === panel.dataset.type){
      panel.classList.add("highlight");
    } else {
      panel.classList.remove("highlight");
    }
  });
}

// --- スマホ用パネル選択明るく ---
function highlightSelectedPanel(){
  renderState(impossiblePanelIds);
}

// --- 選択クリア ---
function clearSelection(){
  selectedPanelId = null;
  selectedPanelType = null;
  renderState(impossiblePanelIds);
}

// --- 盤面クリア ---
function clearGrid(){
  for(let r=0; r<GRID_ROWS; r++){
    for(let c=0; c<GRID_COLS; c++){
      state[r][c] = null;
    }
  }
  impossiblePanelIds = [];
  clearSelection();
  result.innerHTML = "";
  renderState();
}

// --- ゴミ箱関連 ---
// ドラッグ＆ドロップ対応
trash.addEventListener("dragover", e=>{
  e.preventDefault();
  trash.classList.add("over");
});
trash.addEventListener("dragleave", ()=>{
  trash.classList.remove("over");
});
trash.addEventListener("drop", e=>{
  e.preventDefault();
  trash.classList.remove("over");
  if(dragPanelId){
    movePanel(dragPanelId);
    dragPanelId = null;
    dragPanelType = null;
    clearSelection();
    renderState(impossiblePanelIds);
  }
});

// スマホ・タップによる削除対応（盤面パネルのみ）
trash.addEventListener("click", () => {
  // パレット由来の選択は削除しない
  if(selectedPanelId && !selectedPanelId.startsWith("palette_")){
    movePanel(selectedPanelId);
    clearSelection();
    renderState(impossiblePanelIds);
  }
});

// --- パネル削除組み合わせ列挙 ---
function combinations(arr,n){
  const result = [];
  function backtrack(start, comb){
    if(comb.length === n){
      result.push([...comb]);
      return;
    }
    for(let i=start; i<arr.length; i++){
      comb.push(arr[i]);
      backtrack(i+1, comb);
      comb.pop();
    }
  }
  backtrack(0, []);
  return result;
}

// --- 指定パネル複数削除した盤面 ---
function removePanels(grid, removeIds){
  const newGrid = Array(GRID_ROWS).fill(null).map(()=>Array(GRID_COLS).fill('.'));
  for(let r=0; r<GRID_ROWS; r++){
    for(let c=0; c<GRID_COLS; c++){
      const cell = state[r][c];
      if(cell && !removeIds.includes(cell.id)){
        newGrid[r][c] = cell.type;
      }
    }
  }
  return newGrid;
}

// --- 完成判定再帰 ---
function canPlace(grid, panel, row, col){
  return panel.every(([dr, dc])=>{
    const r = row + dr;
    const c = col + dc;
    return r>=0 && r<GRID_ROWS && c>=0 && c<GRID_COLS && grid[r][c] === '.';
  });
}
function place(grid, panel, row, col, ch){
  panel.forEach(([dr, dc])=>{
    grid[row+dr][col+dc] = ch;
  });
}
function remove(grid, panel, row, col){
  panel.forEach(([dr, dc])=>{
    grid[row+dr][col+dc] = '.';
  });
}

function countFilledCells(grid){
  return grid.flat().filter(c => c !== '.').length;
}

// --- 盤面完成可能判定 ---
function canCompleteBoard(grid, solution=[]){
  if(countFilledCells(grid) >= 25){
    solution.length = 0;
    for(let r=0; r<GRID_ROWS; r++) solution.push([...grid[r]]);
    return true;
  }
  for(let r=0; r<GRID_ROWS; r++){
    for(let c=0; c<GRID_COLS; c++){
      if(grid[r][c] === '.'){
        for(const pn in PANELS){
          if(canPlace(grid, PANELS[pn], r, c)){
            place(grid, PANELS[pn], r, c, pn);
            if(canCompleteBoard(grid, solution)) return true;
            remove(grid, PANELS[pn], r, c);
          }
        }
        return false;
      }
    }
  }
  return false;
}

// --- 完成検証 ---
function validateGrid(){
  const gridCopy = state.map(row => row.map(cell => cell ? cell.type : '.'));
  const panelIds = [...new Set(state.flat().filter(c=>c).map(c=>c.id))];

  // 1. 削除なし完成可能か
  impossiblePanelIds = [];
  let solution = [];
  if(canCompleteBoard(gridCopy.map(r=>[...r]), solution)){
    result.innerHTML = "<strong>完成可能です！</strong>" + renderFullSizeResult(solution);
    renderState();
    return;
  }

  // 2. 最大3個まで削除組み合わせで試す
  const MAX_REMOVE = 3;
  let foundIds = null;
  for(let r=1; r<=MAX_REMOVE; r++){
    const combs = combinations(panelIds, r);
    for(const comb of combs){
      const testGrid = removePanels(gridCopy, comb);
      let testSolution = [];
      if(canCompleteBoard(testGrid, testSolution)){
        foundIds = comb;
        solution = testSolution;
        break;
      }
    }
    if(foundIds) break;
  }

  if(foundIds){
    impossiblePanelIds = foundIds;
    const positions = foundIds.flatMap(id=>{
      const pos = [];
      state.forEach((row,r)=>{
        row.forEach((cell,c)=>{
          if(cell && cell.id === id) pos.push(`(${r+1},${c+1})`);
        });
      });
      return pos;
    });
    result.innerHTML = `<strong>完成不能です。光ってるパネルを削除すれば完成可能です：</strong><br>`+
      renderFullSizeResult(solution);
    renderState(impossiblePanelIds);
  } else {
    impossiblePanelIds = [];
    result.innerHTML = `<strong>完成不能です。パネルを最大${MAX_REMOVE}個削除しても完成できません。</strong>`;
    renderState();
  }
}

// --- 結果表示の盤面（グリッド下）を描画 ---
function renderFullSizeResult(grid){
  let html = '<div class="result-grid">';
  for(let r=0; r<GRID_ROWS; r++){
    for(let c=0; c<GRID_COLS; c++){
      const ch = grid[r][c];
      const bg = getColor(ch);
      const color = ch==='L' ? 'black' : 'white';
      html += `<div class="result-cell" style="background-color:${bg}; color:${color}">${ch==='.'?'X':ch}</div>`;
    }
  }
  html += '</div>';
  return html;
}

function getColor(type){
  return {
    I:"purple",
    O:"red",
    L:"gold",
    S:"blue",
    V:"green"
  }[type] || "white";
}

// --- 初期処理 ---
createGrid();
createPalette();
renderState();
