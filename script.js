// パネルの形を定義
const PANELS = {
    I: [[0, 0], [0, 1], [0, 2], [0, 3]],
    O: [[0, 0], [1, 0], [0, 1], [1, 1]],
    L: [[0, 0], [1, 0], [2, 0], [2, 1]],
    S: [[0, 0], [1, 0], [1, 1], [2, 1]],
    V: [[0, 0], [1, 0], [1, 1]]
};

const PANEL_NAMES = ['I', 'O', 'L', 'S', 'V'];

function checkBoard() {
    alert("開始");
    const input = document.getElementById("inputBoard").value.trim();
    const grid = parseInput(input);

    // 結果表示
    const resultDiv = document.getElementById("resultBoard");
alert("結果表示まで");
    // 完成可能か不可能か
    if (canCompleteBoard(grid)) {
        alert("可能");
        resultDiv.value = "完成可能です！\n" + printBoard(grid);
    } else {
        alert("不可能");
        resultDiv.value = "完成不可能です！";
    }
}

function parseInput(input) {
    const rows = input.split("\n").map(row => row.trim());
    const grid = [];

    for (let i = 0; i < 5; i++) {
        const row = rows[i] || ""; // 行が不足していたら空文字
        const cells = [];

        for (let j = 0; j < 6; j++) {
            const char = row[j] || 'x'; // 列が足りない場合は 'x' 扱い
            cells.push(char === 'x' ? '.' : char);
        }

        grid.push(cells);
    }

    return grid;
}

function canCompleteBoard(grid) {
    const filledCells = countFilledCells(grid);

    // 25マス以上埋まっているなら完成と見なす
    if (filledCells >= 25) {
        return true;
    }

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 6; j++) {
            if (grid[i][j] === '.') {
                for (let p = 0; p < PANEL_NAMES.length; p++) {
                    if (canPlace(grid, PANELS[PANEL_NAMES[p]], i, j)) {
                        placePanel(grid, PANELS[PANEL_NAMES[p]], i, j, PANEL_NAMES[p]);
                        if (canCompleteBoard(grid)) {
                            return true;
                        }
                        removePanel(grid, PANELS[PANEL_NAMES[p]], i, j);
                    }
                }
                return false; // どのパネルも配置できない場合
            }
        }
    }
    return false;
}

function canPlace(grid, panel, row, col) {
    for (let i = 0; i < panel.length; i++) {
        const r = row + panel[i][0];
        const c = col + panel[i][1];
        if (r < 0 || r >= 5 || c < 0 || c >= 6 || grid[r][c] !== '.') {
            return false;
        }
    }
    return true;
}

function placePanel(grid, panel, row, col, panelName) {
    for (let i = 0; i < panel.length; i++) {
        const r = row + panel[i][0];
        const c = col + panel[i][1];
        grid[r][c] = panelName;
    }
}

function removePanel(grid, panel, row, col) {
    for (let i = 0; i < panel.length; i++) {
        const r = row + panel[i][0];
        const c = col + panel[i][1];
        grid[r][c] = '.';
    }
}

function countFilledCells(grid) {
    let count = 0;
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 6; j++) {
            if (grid[i][j] !== '.') {
                count++;
            }
        }
    }
    return count;
}

function printBoard(grid) {
    let boardText = "";
    for (let i = 0; i < 5; i++) {
        boardText += grid[i].join('') + "\n";
    }
    return boardText;
}

window.onload = () => {
    document.getElementById("inputBoard").value = `
xxxxxx
xxxxxx
Lxxxxx
Lxxxxx
LLxxxx
`;
}
