/***** 変更点一覧 ***********************************************
1. PANELS に新しい O（3×2）を追加
2. 既存の O は "o" に改名
3. パレットと描画処理が新しい O / 旧 o を正しく扱うよう修正
4. 色も追加（新O = #ccc）
***************************************************************/

const grid = document.getElementById("grid");
const trash = document.getElementById("trash");
const result = document.getElementById("result");
const palette = document.getElementById("palette");

const GRID_ROWS = 5;
const GRID_COLS = 6;

/*******************************************
 * ★ パネル定義（変更あり）
 *   - 新しい O：3×2（6マス）
 *   - 旧 O は "o" に変更（2×2）
 *******************************************/
const PANELS = {
  I: [[0,0],[0,1],[0,2],[0,3]],
  o: [[0,0],[1,0],[0,1],[1,1]],   // ←旧O（名称変更）
  L: [[0,0],[1,0],[2,0],[2,1]],
  S: [[0,0],[1,0],[1,1],[2,1]],
  V: [[0,0],[1,0], [1,1]],
  O: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]] // ←新O（6マス）
};

/******************
 * ★ 色定義変更
 ******************/
function getColor(type){
  return {
    I:"purple",
    o:"red",      // 旧O
    O:"#aaaaaa",  // 新O の色（白っぽいグレー）
    L:"gold",
    S:"blue",
    V:"green"
  }[type] || "white";
}

// シャッフル
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

let dragPanelType = null;
let dragPanelId = null;
let nextPanelId = 1;

let selectedPanelId = null;
let selectedPanelType = null;

let impossiblePanelIds = [];

const state = Array.from({length: GRID_ROWS}, () => Array(GRID_COLS).fill(null));

/************ グリッド初期化 ************/
function createGrid(){
  grid.innerHTML = "";
  for(let r=0; r<GRID_ROWS; r++){
    for(let c=0; c<GRID_COLS; c++){
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener("dragover", e => e.preventDefault());
      cell.addEventListener("drop", e => {
        e.preventDefault();
        if(!dragPanelType) return;

        if(dragPanelId) movePanel(dragPanelId);

        placePanel(dragPanelType, r, c, dragPanelId || `p${nextPanelId++}`);

        dragPanelId = null;
        dragPanelType = null;
        clearSelection();
      });

      cell.addEventListener("dragstart", e => {
        const val = state[r][c];
        if(val){
          dragPanelType = val.type;
          dragPanelId = val.id;
          clearSelection();
        }
      });

      // スマホ tap 版
      cell.addEventListener("click", () => {
        const val = state[r][c];
        if(selectedPanelId === null){
          if(val){
            selectedPanelId = val.id;
            selectedPanelType = val.type;
            impossiblePanelIds.push(selectedPanelId);
            renderState(impossiblePanelIds);
          }
        } else {
          if(selectedPanelId.startsWith("palette_")){
            if(canPlacePanelAt(selectedPanelType, r, c, null)){
              placePanel(selectedPanelType, r, c, `p${nextPanelId++}`);
            }
            clearSelection();
          } else {
            if(canPlacePanelAt(selectedPanelType, r, c, selectedPanelId)){
              movePanel(selectedPanelId);
              placePanel(selectedPanelType, r, c, selectedPanelId);
            }
            clearSelection();
          }
            renderState();
        }
      });

      grid.appendChild(cell);
    }
  }
  renderState();
}

/************ パレット生成（新Oも表示） ************/
function createPalette(){
  palette.innerHTML = "";
  for(const type in PANELS){
    const btn = document.createElement("div");
    btn.className = "panel " + type;
    btn.textContent = type;
    btn.draggable = true;
    btn.dataset.type = type;

    btn.addEventListener("dragstart", e => {
      dragPanelType = e.target.dataset.type;
      dragPanelId = null;
      clearSelection();
    });

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

/************ 配置判定 ************/
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

function movePanel(panelId){
  for(let r=0; r<GRID_ROWS; r++){
    for(let c=0; c<GRID_COLS; c++){
      if(state[r][c]?.id === panelId){
        state[r][c] = null;
      }
    }
  }
}

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

/************ 画面表示 ************/
function renderState(highlightIds=[]){
  const highlightSet = new Set(highlightIds);

  document.querySelectorAll(".cell").forEach(cell=>{
    const r = +cell.dataset.row;
    const c = +cell.dataset.col;
    const val = state[r][c];

    cell.textContent = val?.type || "";
    cell.className = "cell";
    if(val) cell.classList.add(val.type);

    if(val && highlightSet.has(val.id)){
      cell.classList.add("highlight");
      //cell.style.filter = "brightness(1.5)";
    } else {
      //cell.style.filter = "";
    }

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

  document.querySelectorAll(".panel").forEach(panel=>{
    if(selectedPanelId === `palette_${panel.dataset.type}`){
      panel.classList.add("highlight");
    } else {
      panel.classList.remove("highlight");
    }
  });
}

function highlightSelectedPanel(){
  renderState(impossiblePanelIds);
}

function clearSelection(){
  selectedPanelId = null;
  selectedPanelType = null;
  renderState(impossiblePanelIds);
}

/************ 盤面クリア ************/
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

/************ ゴミ箱 ************/
trash.addEventListener("dragover", e=>{
  e.preventDefault();
  trash.classList.add("over");
});
trash.addEventListener("dragleave", ()=>trash.classList.remove("over"));
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
trash.addEventListener("click", () => {
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
const requiredCells = 25;  // 25マス以上埋まれば完成と判定
var panelTypes = Object.keys(PANELS);

// --- 盤面完成可能判定 ---
function canCompleteBoard(grid, solution = []) {
  const filled = countFilledCells(grid);
  if (filled >= requiredCells) {
    solution.length = 0;
    for (let r = 0; r < GRID_ROWS; r++) {
      solution.push([...grid[r]]);
    }
    return true;
  }

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (grid[r][c] === '.') {
        let canPlaceAny = false;
        for (const t of panelTypes) {
          const shape = PANELS[t];
          if (canPlace(grid, shape, r, c)) {
            canPlaceAny = true;
            place(grid, shape, r, c, t);
            if (canCompleteBoard(grid, solution)) return true;
            remove(grid, shape, r, c);
          }
        }
        // ここで即falseにせず、空白セルをスキップして次を探す
        //if (!canPlaceAny) {
        //  return canCompleteBoardSkipCell(grid, solution, r, c);
        //}
      }
    }
  }
  //return false;
}

// 空白セルをスキップしながら再帰を続けるヘルパー関数例
function canCompleteBoardSkipCell(grid, solution, startRow, startCol) {
  for (let rr = startRow; rr < GRID_ROWS; rr++) {
    for (let cc = (rr === startRow ? startCol + 1 : 0); cc < GRID_COLS; cc++) {
      if (grid[rr][cc] === '.') {
        let canPlaceAny = false;
        for (const t of panelTypes) {
          const shape = PANELS[t];
          if (canPlace(grid, shape, rr, cc)) {
            canPlaceAny = true;
            place(grid, shape, rr, cc, t);
            if (canCompleteBoard(grid, solution)) return true;
            remove(grid, shape, rr, cc);
          }
        }
        if (!canPlaceAny) {
          return false;
        }
      }
    }
  }

  // もしここまで来たら空白なし、つまり完成可能
  solution.length = 0;
  for (let r = 0; r < GRID_ROWS; r++) {
    solution.push([...grid[r]]);
  }
  return true;
}

// --- 完成検証 ---
function validateGrid(){
  panelTypes = shuffle(["I", "O", "L", "S", "V"]);

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
    result.innerHTML = `<strong>完成不能です。上の図の光ってるパネルを削除すれば完成可能です：</strong><br>`+
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
      const color = (ch==='L' || ch==='O') ? 'black' : 'white';
      html += `<div class="result-cell" style="background-color:${bg}; color:${color}">${ch==='.'?'X':ch}</div>`;
    }
  }
  html += '</div>';
  return html;
}

function getColor(type){
  return {
    I:"purple",
    o:"red",
    L:"gold",
    S:"blue",
    V:"green",
    O:"#aaaaaa"
  }[type] || "white";
}

// --- 初期処理 ---
createGrid();
createPalette();
renderState();
