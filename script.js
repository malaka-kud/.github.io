const grid = document.getElementById("grid");
const trash = document.getElementById("trash");
const result = document.getElementById("result");

const GRID_ROWS = 5;
const GRID_COLS = 6;

const PANELS = {
	I: [
		[0, 0],
		[0, 1],
		[0, 2],
		[0, 3]
	],
	O: [
		[0, 0],
		[1, 0],
		[0, 1],
		[1, 1]
	],
	L: [
		[0, 0],
		[1, 0],
		[2, 0],
		[2, 1]
	],
	S: [
		[0, 0],
		[1, 0],
		[1, 1],
		[2, 1]
	],
	V: [
		[0, 0],
		[1, 0],
		[1, 1]
	]
};

let dragPanelType = null;
let dragPanelId = null;
let nextPanelId = 1;

let touchStartCell = null; // タッチ開始したセル要素

let state = Array.from({
	length: GRID_ROWS
}, () => Array(GRID_COLS).fill(null));

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
				if (!dragPanelType) return;
				const panelId = dragPanelId || `p${nextPanelId++}`;
				movePanel(panelId);
				placePanel(dragPanelType, r, c, panelId);
				dragPanelId = null;
				dragPanelType = null;
			});

			grid.appendChild(cell);
		}
	}
	renderState();
}

document.querySelectorAll(".panel").forEach((panel) => {
	panel.addEventListener("dragstart", (e) => {
		dragPanelType = e.target.dataset.type;
		dragPanelId = null;
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
	movePanel(dragPanelId);
	renderState();
	dragPanelId = null;
});

function movePanel(panelId) {
	for (let r = 0; r < GRID_ROWS; r++) {
		for (let c = 0; c < GRID_COLS; c++) {
			if (state[r][c]?.id === panelId) {
				state[r][c] = null;
			}
		}
	}
}

function placePanel(type, baseRow, baseCol, panelId) {
	const shape = PANELS[type];
	if (!shape.every(([dr, dc]) => {
			const r = baseRow + dr;
			const c = baseCol + dc;
			return r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && state[r][c] ===
				null;
		})) return;

	shape.forEach(([dr, dc]) => {
		const r = baseRow + dr;
		const c = baseCol + dc;
		state[r][c] = {
			type, id: panelId
		};
	});

	renderState();
}

function renderState(highlightIds = []) {
	document.querySelectorAll(".cell").forEach((cell) => {
		const r = +cell.dataset.row;
		const c = +cell.dataset.col;
		const val = state[r][c];
		cell.textContent = val?.type || "";
		cell.className = "cell"; // 一旦リセット
		if (val) cell.classList.add(val.type); // パネル色クラス付与

		if (val && highlightIds.includes(val.id)) {
			cell.classList.add("highlight"); // 明るくするクラス
		}

		if (val) {
			cell.draggable = true;
			cell.ondragstart = (e) => {
				dragPanelType = val.type;
				dragPanelId = val.id;
			};
		} else {
			cell.draggable = false;
			cell.ondragstart = null;
		}
	});
}

function clearGrid() {
	state = Array.from({
		length: GRID_ROWS
	}, () => Array(GRID_COLS).fill(null));
	renderState();
	result.innerHTML = "";
}

// 全ての組み合わせを列挙する関数（n個選ぶ）
function combinations(arr, n) {
	const result = [];

	function backtrack(start, comb) {
		if (comb.length === n) {
			result.push([...comb]);
			return;
		}
		for (let i = start; i < arr.length; i++) {
			comb.push(arr[i]);
			backtrack(i + 1, comb);
			comb.pop();
		}
	}
	backtrack(0, []);
	return result;
}

function validateGrid() {
	const gridCopy = state.map(row => row.map(cell => cell ? cell.type : '.'));
	const panelIds = [...new Set(state.flat().filter(cell => cell).map(cell =>
		cell.id))];

	// 1. 削除なしで完成可能か試す
	let solution = [];
	if (canCompleteBoard(gridCopy.map(row => [...row]), solution)) {
		result.innerHTML = "<strong>完成可能です！</strong>" + renderFullSizeResult(solution);
		renderState();
		return;
	}

	// 2. 最大3個まで削除組み合わせを試す
	const MAX_REMOVE = 3;
	let foundIds = null;

	for (let r = 1; r <= MAX_REMOVE; r++) {
		const combs = combinations(panelIds, r);
		for (const comb of combs) {
			const testGrid = removePanels(gridCopy, comb);
			let testSolution = [];
			if (canCompleteBoard(testGrid, testSolution)) {
				foundIds = comb;
				solution = testSolution;
				break;
			}
		}
		if (foundIds) break;
	}

	if (foundIds) {
		const positions = foundIds.flatMap(id => {
			const pos = [];
			state.forEach((row, r) => {
				row.forEach((cell, c) => {
					if (cell && cell.id === id) pos.push(`(${r+1},${c+1})`);
				});
			});
			return pos;
		});
		result.innerHTML = `<strong>完成不能です。以下のパネルを削除すれば完成可能です：</strong><br>` +
			`パネル位置: ${positions.join(", ")}<br>` +
			renderFullSizeResult(solution);
		renderState(foundIds);
	} else {
		result.innerHTML =
			`<strong>完成不能です。パネルを最大${MAX_REMOVE}個削除しても完成できません。</strong>`;
		renderState();
	}
}

function removePanels(grid, removeIds) {
	const newGrid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(
		'.'));
	for (let r = 0; r < GRID_ROWS; r++) {
		for (let c = 0; c < GRID_COLS; c++) {
			const cell = state[r][c];
			if (cell && !removeIds.includes(cell.id)) {
				newGrid[r][c] = cell.type;
			}
		}
	}
	return newGrid;
}


// 指定したパネルID複数を '.' に置き換えた盤面を返す関数
function removePanels(grid, removeIds) {
	// 元のgridはパネル種別なのでidを使うためstateを参照する
	const newGrid = Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(
		'.'));
	for (let r = 0; r < GRID_ROWS; r++) {
		for (let c = 0; c < GRID_COLS; c++) {
			const cell = state[r][c];
			if (cell && !removeIds.includes(cell.id)) {
				newGrid[r][c] = cell.type;
			}
		}
	}
	return newGrid;
}


function canPlace(grid, panel, row, col) {
	return panel.every(([dr, dc]) => {
		const r = row + dr;
		const c = col + dc;
		return r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && grid[r][c] ===
			'.';
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

function canCompleteBoard(grid, solution) {
	const filled = grid.flat().filter(c => c !== '.').length;
	if (filled >= 25) {
		for (let row of grid) solution.push([...row]);
		return true;
	}

	for (let row = 0; row < GRID_ROWS; row++) {
		for (let col = 0; col < GRID_COLS; col++) {
			if (grid[row][col] === '.') {
				for (const panelName in PANELS) {
					const shape = PANELS[panelName];
					if (canPlace(grid, shape, row, col)) {
						place(grid, shape, row, col, panelName);
						if (canCompleteBoard(grid, solution)) return true;
						remove(grid, shape, row, col);
					}
				}
				return false;
			}
		}
	}
	return false;
}

function renderFullSizeResult(grid) {
	let html = '<div class="result-grid">';
	for (let r = 0; r < GRID_ROWS; r++) {
		for (let c = 0; c < GRID_COLS; c++) {
			const ch = grid[r][c];
			const bg = getColor(ch);
			const color = ch === 'L' ? 'black' : 'white';
			html +=
				`<div class="result-cell" style="background-color:${bg}; color:${color}">${ch === '.' ? 'X' : ch}</div>`;
		}
	}
	html += '</div>';
	return html;
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

createGrid();
