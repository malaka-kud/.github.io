const GRID_ROWS = 5;
const GRID_COLS = 6;

const PANELS = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [0, 1], [1, 0], [1, 1]],
  L: [[0, 0], [1, 0], [2, 0], [2, 1]],
  S: [[0, 1], [0, 2], [1, 0], [1, 1]],
  V: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
};

let state = Array.from({ length: GRID_ROWS }, () =>
  Array(GRID_COLS).fill(null)
);

let panelCount = 0;
let dragPanelType = null;
let dragPanelId = null;
let dragPanelOrigin = null;

const grid = document.getElementById("grid");
const palette = document.getElementById("palette");

function createGrid() {
  grid.innerHTML = "";
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.ondragover = (e) => e.preventDefault();
      cell.ondrop = (e) => {
        e.preventDefault();
        if (!dragPanelType) return;
        placePanel(dragPanelType, r, c, dragPanelId ?? `p${panelCount++}`);
      };
      cell.draggable = true;
      cell.addEventListener("dragstart", onCellDragStart);
      grid.appendChild(cell);
    }
  }
}

function createPalette() {
  for (let type in PANELS) {
    const btn = document.createElement("div");
    btn.className = "panel";
    btn.textContent = type;
    btn.draggable = true;
    btn.addEventListener("dragstart", () => {
      dragPanelType = type;
      dragPanelId = null;
    });
    palette.appendChild(btn);
  }
}

function onCellDragStart(e) {
  const r = parseInt(e.target.dataset.row);
  const c = parseInt(e.target.dataset.col);
  const val = state[r][c];
  if (!val) return;
  dragPanelType = val.type;
  dragPanelId = val.id;
  dragPanelOrigin = { row: r, col: c };
}

function placePanel(type, baseRow, baseCol, panelId) {
  // 移動元がある場合、そのパネルを一旦削除
  if (dragPanelOrigin && dragPanelId) {
    // 移動先が同じなら無視
    if (baseRow === dragPanelOrigin.row && baseCol === dragPanelOrigin.col) {
      dragPanelOrigin = null;
      dragPanelId = null;
      return;
    }

    // 移動先に置けるか判定（移動元は空扱い）
    if (!PANELS[type].every(([dr, dc]) => {
      const r = baseRow + dr;
      const c = baseCol + dc;
      if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) return false;
      const cell = state[r][c];
      return cell === null || cell.id === dragPanelId;
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

  // 配置可能かチェック（空白マスのみ）
  const shape = PANELS[type];
  if (!shape.every(([dr, dc]) => {
    const r = baseRow + dr;
    const c = baseCol + dc;
    return r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && state[r][c] === null;
  })) {
    dragPanelOrigin = null;
    dragPanelId = null;
    return;
  }

  // パネル配置
  shape.forEach(([dr, dc]) => {
    const r = baseRow + dr;
    const c = baseCol + dc;
    state[r][c] = { type, id: panelId };
  });

  renderState();

  dragPanelOrigin = null;
  dragPanelId = null;
}

function renderState() {
  document.querySelectorAll(".cell").forEach(cell => {
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    const val = state[r][c];
    cell.textContent = val ? val.type : "";
    cell.className = "cell" + (val ? ` panel panel-${val.type}` : "");
  });
}

// ======================
// ✅ スマホ用スワイプ対応
// ======================
let touchDrag = null;
let touchMoved = false;

grid.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) return;

  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target || !target.classList.contains('cell')) return;

  const r = parseInt(target.dataset.row);
  const c = parseInt(target.dataset.col);
  const val = state[r][c];
  if (!val) return;

  touchDrag = { id: val.id, type: val.type, originRow: r, originCol: c };
  touchMoved = false;

  e.preventDefault();
});

grid.addEventListener('touchmove', (e) => {
  if (!touchDrag) return;
  touchMoved = true;
  e.preventDefault();
});

grid.addEventListener('touchend', (e) => {
  if (!touchDrag) return;

  if (!touchMoved) {
    touchDrag = null;
    return;
  }

  const touch = e.changedTouches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target || !target.classList.contains('cell')) {
    touchDrag = null;
    return;
  }

  const r = parseInt(target.dataset.row);
  const c = parseInt(target.dataset.col);

  if (r === touchDrag.originRow && c === touchDrag.originCol) {
    touchDrag = null;
    return;
  }

  placePanel(touchDrag.type, r, c, touchDrag.id);

  touchDrag = null;
  e.preventDefault();
});

// =====================

createGrid();
createPalette();
renderState();
