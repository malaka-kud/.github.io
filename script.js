const grid = document.getElementById("grid");
const trash = document.getElementById("trash");
const result = document.getElementById("result");
const GRID_ROWS = 5;
const GRID_COLS = 6;

const PANELS = {
  I: [[0, 0], [0, 1], [0, 2], [0, 3]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  L: [[0, 0], [1, 0], [2, 0], [2, 1]],
  S: [[0, 0], [1, 0], [1, 1], [2, 1]],
  V: [[0, 0], [1, 0], [1, 1]]
};

let dragPanelType = null;
let dragPanelId = null;
let dragPanelOrigin = null; // 追加：ドラッグ開始時のパネル元座標
let nextPanelId = 1;

const state = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
let removablePanelIds = new Set(); // 削除候補パネルIDセット

function createGrid() {
  grid.innerHTML = "";
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      cell.addEventListener("dragover", (e) => e.preventDefault());
      cell.addEventListener("drop", (e) => {
        e.preventDefault();
        const panelType = dragPanelType;
        const panelId = dragPanelId || `p${nextPanelId++}`;
        placePanel(panelType, r, c, panelId);
        dragPanelId = null;
        dragPanelOrigin = null;
      });

      cell.addEventListener("dragstart", onCellDragStart);

      grid.appendChild(cell);
    }
  }
}

document.querySelectorAll(".panel").forEach((panel) => {
  panel.addEventListener("dragstart", (e) => {
    dragPanelType = e.target.dataset.type;
    dragPanelId = null;
    dragPanelOrigin = null;
  });
});

trash.addEventListener("dragover", (e) => {
  e.preventDefault();
  trash.classList.add("over");
});
trash.addEventListener("dragleave", () => trash.classList.remove("over"));
trash.addEventListener("drop", (e) => {
  e.preventDefault();
  trash.classList.remove("over");
  if (!dragPanelId) return;

  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (state[r][c]?.id === dragPanelId) {
        state[r][c] = null;
      }
    }
  }
  renderState();
  dragPanelId = null;
  dragPanelOrigin = null;
});

// 盤面セルドラッグ開始時の処理
function onCellDragStart(e) {
  const r = parseInt(e.target.dataset.row);
  const c = parseInt(e.target.dataset.col);
  const val = state[r][c];
  if (!val) return;

  dragPanelType = val.type;
  dragPanelId = val.id;
  dragPanelOrigin = { row: r, col: c };
}

// パネルを配置（新規配置 or 移動）
function placePanel(type, baseRow, baseCol, panelId) {
  if (!type) return;

  // 移動時処理
  if (dragPanelOrigin && dragPanelId) {
    // 同じ位置なら何もしない
    if (baseRow === dragPanelOrigin.row && baseCol === dragPanelOrigin.col) {
      dragPanelOrigin = null;
      dragPanelId = null;
      return;
    }

    // 移動先に置けるか判定（移動元のパネルは除外して判定）
    if (!PANELS[type].every(([dr, dc]) => {
      const r = baseRow + dr;
      const c = baseCol + dc;
      if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return false;

      // 移動元のパネルセルは空扱い
      if (state[r][c]?.id === dragPanelId) return true;
      return state[r][c] === null;
    })) {
      dragPanelOrigin = null;
      dragPanelId = null;
      return;
    }

    // 移動元パネル削除
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (state[r][c]?.id === dragPanelId) {
          state[r][c] = null;
        }
      }
    }
  }

  // 新規配置または移動先にパネル配置
  if (!PANELS[type].every(([dr, dc]) => {
    const r = baseRow + dr;
    const c = baseCol + dc;
    return r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && state[r][c] === null;
  })) {
    dragPanelOrigin = null;
    dragPanelId = null;
    return;
  }

  PANELS[type].forEach(([dr, dc]) => {
    const r = baseRow + dr;
    const c = baseCol + dc;
    state[r][c] = { type, id: panelId };
  });

  renderState();

  dragPanelOrigin = null;
  dragPanelId = null;
}

function renderState() {
  document.querySelectorAll(".cell").forEach((cell) => {
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    const val = state[r][c];
    cell.textContent = val?.type || "";

    if (val) {
      const baseColor = getColor(val.type);
      if (removablePanelIds.has(val.id)) {
        cell.style.backgroundColor = lightenColor(baseColor, 0.6);
      } else {
        cell.style.backgroundColor = baseColor;
      }
      cell.style.color = (val.type === "L" ? "black" : "white");

      cell.draggable = true;
      cell.ondragstart = (e) => {
        onCellDragStart(e);
      };
    } else {
      cell.style.backgroundColor = "white";
      cell.style.color = "black";
      cell.textContent = "";
      cell.draggable = false;
      cell.ondragstart = null;
    }
  });
}

function getColor(type) {
  return {
    I: "purple",
    O: "red",
    L: "gold",
    S: "blue",
    V: "green"
  }[type] || "white";
}

function lightenColor(color, factor) {
  const colors = {
    purple: [128, 0, 128],
    red: [255, 0, 0],
    gold: [255, 215, 0],
    blue: [0, 0, 255],
    green: [0, 128, 0],
    white: [255, 255, 255],
  };
  let rgb = colors[color] || [200, 200, 200];
  rgb = rgb.map(c => Math.min(255, Math.floor(c + (255 - c) * factor)));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function clearGrid() {
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      state[r][c] = null;
    }
  }
  removablePanelIds.clear();
  renderState();
  result.innerHTML = "";
}

function validateGrid() {
  const gridCopy = state.map(row => row.map(cell => cell ? cell.type : '.'));
  const originalState = state.map(row => row.map(cell => cell ? { ...cell } : null));

  removablePanelIds.clear();

  if (canCompleteBoard(gridCopy)) {
    result.innerHTML = "<strong>完成可能です！</strong>" + renderMiniGrid(gridCopy);
    renderState();
    return;
  }

  const usedIds = [...new Set(state.flat().filter(x => x).map(x => x.id))];
  let foundRemovable = false;

  for (const id of usedIds) {
    const testGrid = originalState.map(row => row.map(cell => cell && cell.id === id ? null : cell));
    const testGridCopy = testGrid.map(row => row.map(cell => cell ? cell.type : '.'));
    if (canCompleteBoard(testGridCopy)) {
      removablePanelIds.add(id);
      foundRemovable = true;
    }
  }

  if (foundRemovable) {
    let message = "完成不可能です。\n以下のパネルを削除すれば完成可能です。パネルの色が明るくなっています。\n";
    removablePanelIds.forEach(id => {
      const positions = [];
      originalState.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell?.id === id) positions.push(`(${r+1},${c+1})`);
        });
      });
      message += `パネル ${positions.join(', ')}\n`;
    });
    result.innerHTML = message;
    renderState();
    return;
  }

  result.innerHTML = "<strong>完成不可能です。</strong> どの1パネルを削除しても完成不可です。";
  renderState();
}

function renderMiniGrid(grid) {
  let html = '<div class="mini-grid">';
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const ch = grid[r][c];
      html += `<div class="mini-cell" style="background-color:${getColor(ch)}; color:${ch === 'L' ? 'black' : 'white'}">${ch === '.' ? 'X' : ch}</div>`;
    }
  }
  html += '</div>';
  return html;
}

function countFilledCells(grid) {
  return grid.flat().filter(c => c !== '.').length;
}

function canPlace(grid, panel, row, col) {
  return panel.every(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    return r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && grid[r][c] === '.';
  });
}

function place(grid, panel, row, col, ch) {
  panel.forEach(([dr, dc]) => {
    grid[row + dr][col + dc] = ch;
  });
}

function remove(grid, panel, row, col) {
  panel.forEach(([dr, dc]) => {
    grid[row + dr][col + dc] = '.';
  });
}

function canCompleteBoard(grid) {
  const filledCells = countFilledCells(grid);
  if (filledCells >= 25) return true;

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (grid[row][col] === '.') {
        for (const panelName in PANELS) {
          const panelShape = PANELS[panelName];
          if (canPlace(grid, panelShape, row, col)) {
            place(grid, panelShape, row, col, panelName);
            if (canCompleteBoard(grid)) return true;
            remove(grid, panelShape, row, col);
          }
        }
      }
    }
  }
  return false;
}

createGrid();
renderState();
