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
    const input = document.getElementById("inputBoard").value.trim();
    const rawRows = input.split("\n").map(row => row.trim().toUpperCase());
    const resultDiv = document.getElementById("resultBoard");

    // 🔸 エラー出力は resultBoard に出す
    // 1. 行数チェック
    if (rawRows.length !== 5) {
        resultDiv.value = "エラー: 行数が不正です。盤面は5行である必要があります。";
        return;
    }

    // 2. 列数・文字チェック
    const allowedChars = ['I', 'O', 'L', 'S', 'V', 'X', ' '];
    for (let i = 0; i < rawRows.length; i++) {
        if (rawRows[i].length !== 6) {
            resultDiv.value = `エラー: 第 ${i + 1} 行の文字数が ${rawRows[i].length} 文字です。各行は6文字である必要があります。`;
            return;
        }

        for (let j = 0; j < 6; j++) {
            const ch = rawRows[i][j];
            if (!allowedChars.includes(ch)) {
                resultDiv.value = `エラー: 不正な文字「${ch}」が含まれています。使用可能な文字は X,I,O,L,S,V または空白です。`;
                return;
            }
        }
    }

    // 🔸 正常時の処理
    const grid = parseInput(input);

    if (canCompleteBoard(grid)) {
        resultDiv.value = "完成可能です！\n" + printBoard(grid);
    } else {
        resultDiv.value = "完成不可能です！";
    }
}


function parseInput(input) {
    const rows = input.split("\n").map(row => row.trim().toUpperCase());
    const grid = [];

    for (let i = 0; i < 5; i++) {
        const row = rows[i] || ""; // 行不足対応
        const cells = [];

        for (let j = 0; j < 6; j++) {
            const char = row[j] || 'X'; // 列不足対応
            cells.push(char === 'X' ? '.' : char);
        }

        grid.push(cells);
    }

    return grid;
}
function canCompleteBoard(grid) {
    const filledCells = countFilledCells(grid);

    // 25マス以上埋まっていれば完成とみなす
    if (filledCells >= 25) {
        return true;
    }

    // 空きマスをすべて走査して試す
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 6; col++) {
            if (grid[row][col] === '.') {
                for (let p = 0; p < PANEL_NAMES.length; p++) {
                    const panelShape = PANELS[PANEL_NAMES[p]];
                    if (canPlace(grid, panelShape, row, col)) {
                        placePanel(grid, panelShape, row, col, PANEL_NAMES[p]);

                        // 再帰して残りのマスを試す
                        if (canCompleteBoard(grid)) {
                            return true;
                        }

                        // 戻して次の候補を試す
                        removePanel(grid, panelShape, row, col);
                    }
                }

                // どのパネルも置けなかった場合、この空きマスから始める配置では不可能
                return false;
            }
        }
    }

    // すべてのマスを処理し終えてここに到達したら完成できない
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
        boardText += grid[i].map(cell => cell === '.' ? 'X' : cell).join('') + "\n";
    }
    return boardText;
}

function clearInput() {
    document.getElementById("inputBoard").value = "";
 }

function fillWithX() {
    const filled = Array(5).fill("XXXXXX").join("\n");
    document.getElementById("inputBoard").value = filled;
}

window.onload = () => {
    document.getElementById("inputBoard").value = `xxxxxx
xxxxxx
Lxxxxx
Lxxxxx
LLxxxx
`;
}
