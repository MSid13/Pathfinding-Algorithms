import { Cell } from './grid.js';
import { AstarHeuristic, Pathfinder, dijkastraHeuristic, greedyHeuristic, mlHeuristic } from './pathfinder.js';


const canvas = document.getElementById('gridCanvas');
const ROWS = 20, COLS = 20;
const WIDTH = canvas.width, HEIGHT = canvas.height;
const cellSize = WIDTH / ROWS;
let grid = [];
let start = null, end = null;
let mouseDown = false, wallDrawMode = null;
let runHistory = [];
let setups = JSON.parse(localStorage.getItem('simpleSetups') || '{}');


function drawGrid() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            const cell = grid[i][j];
            ctx.fillStyle = cell.color;
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#aaa';
            ctx.lineWidth = 1;
            ctx.strokeRect(j * cellSize, i * cellSize, cellSize, cellSize);
        }
    }
}

function clearGrid() { //clearing the grid to become blank
    grid = [];
    for (let i = 0; i < ROWS; i++) {
        let row = [];
        for (let j = 0; j < COLS; j++) {
            row.push(new Cell(i, j));
        }
        grid.push(row);
    }
    start = null;
    end = null;
    runHistory = [];
    drawGrid();
    updateTable();
}

//Pathfinding
function getSelectedAlgorithm() { //picking the algorithm based on the dropdown selection
    const algo = document.getElementById('algoSelect').value;
    if (algo === 'astar') return AstarHeuristic;
    if (algo === 'dijkstra') return () => 0;
    if (algo === 'greedy') return (a, b) => Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
    if (algo === 'ml') return async (a, b) => await mlHeuristic(a, b, grid);
    return AstarHeuristic; //default to A* if nothing is selected
}

async function runPathfinder() {
    if (!start || !end) {
        alert('Set start and end!');
        return;
    }
    const heuristic = getSelectedAlgorithm();
    const pf = new Pathfinder({ grid, rows: ROWS, cols: COLS }, heuristic);
    //log which algorithm is being run
    console.log('Selected algorithm:', document.getElementById('algoSelect').value);
    if (document.getElementById('algoSelect').value === 'ml') {
        console.log('Calling pf.runAsync (ML)...');
        await pf.runAsync(start, end, drawGrid, (success, nodesVisited, distanceTraveled) => {
            runHistory.push({ nodesVisited, distanceTraveled });
            updateTable();
            if (success) showPath();
        });
    } else {
        pf.run(start, end, drawGrid, (success, nodesVisited, distanceTraveled) => {
            runHistory.push({ nodesVisited, distanceTraveled });
            updateTable();
            if (success) showPath();
        });
    }
}

function showPath() {
    let cell = end;
    while (cell && cell !== start) {
        if (cell !== end) cell.color = '#ff9800';
        cell = cell.parent;
    }
    drawGrid();
}


function updateTable() {
    const tbody = document.getElementById('resultsBody');
    tbody.innerHTML = '';
    runHistory.forEach((run, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i + 1}</td><td>${run.nodesVisited}</td><td>${run.distanceTraveled}</td>`;
        tbody.appendChild(tr);
    });
}

//Setups of a bunch of stuff
function saveSetup() {
    const name = document.getElementById('setupName').value.trim();
    if (!name) {
        alert('Enter a setup name!');
        return;
    }
    setups[name] = {
        grid: grid.map(row => row.map(cell => ({ isWall: cell.isWall }))),
        start: start ? { row: start.row, col: start.col } : null,
        end: end ? { row: end.row, col: end.col } : null
    };
    localStorage.setItem('simpleSetups', JSON.stringify(setups));
    updateSetupDropdown();
}

function loadSetup() {
    const select = document.getElementById('setupSelect');
    const name = select.value;
    if (!name || !setups[name]) return;
    const setup = setups[name];
    grid = [];
    for (let i = 0; i < ROWS; i++) {
        let row = [];
        for (let j = 0; j < COLS; j++) {
            let cell = new Cell(i, j);
            cell.isWall = setup.grid[i][j].isWall;
            cell.color = cell.isWall ? 'black' : 'white';
            row.push(cell);
        }
        grid.push(row);
    }
    start = setup.start ? grid[setup.start.row][setup.start.col] : null;
    end = setup.end ? grid[setup.end.row][setup.end.col] : null;
    if (start) start.color = 'green';
    if (end) end.color = 'red';
    runHistory = [];
    drawGrid();
    updateTable();
}

function updateSetupDropdown() {
    const select = document.getElementById('setupSelect');
    select.innerHTML = '';
    Object.keys(setups).forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
}

//option to export data to csv(excel)
function exportToExcel() {
    const table = document.querySelector('table');
    let csv = Array.from(table.rows).map(row => Array.from(row.cells).map(cell => cell.textContent).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pathfinding_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

//mouse Events(Controls)
function handleMouse(e, isClick = false) {
    const rect = canvas.getBoundingClientRect();
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return;
    const cell = grid[row][col];
    if (isClick) {
        if (!start && !cell.isWall) {
            start = cell; start.color = 'green';
        } else if (!end && cell !== start && !cell.isWall) {
            end = cell; end.color = 'red';
        } else if (cell !== start && cell !== end) {
            cell.isWall = !cell.isWall;
            cell.color = cell.isWall ? 'black' : 'white';
        }
    } else if (mouseDown && start && end && cell !== start && cell !== end) {
        if (wallDrawMode === 'add' && !cell.isWall) {
            cell.isWall = true; cell.color = 'black';
        } else if (wallDrawMode === 'remove' && cell.isWall) {
            cell.isWall = false; cell.color = 'white';
        }
    }
    drawGrid();
}

canvas.addEventListener('mousedown', e => {
    mouseDown = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);
    if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        const cell = grid[row][col];
        if (start && end && cell !== start && cell !== end) {
            wallDrawMode = cell.isWall ? 'remove' : 'add';
        } else {
            wallDrawMode = null;
        }
    } else {
        wallDrawMode = null;
    }
    handleMouse(e, true);
});
canvas.addEventListener('mousemove', e => {
    if (mouseDown) handleMouse(e, false);
});
canvas.addEventListener('mouseup', () => {
    mouseDown = false;
    wallDrawMode = null;
});
canvas.addEventListener('mouseleave', () => {
    mouseDown = false;
    wallDrawMode = null;
});

window.addEventListener('DOMContentLoaded', () => {
    clearGrid();
    updateSetupDropdown();
    document.getElementById('clearBtn').onclick = clearGrid;
    document.getElementById('startBtn').onclick = runPathfinder;
    document.getElementById('saveBtn').onclick = saveSetup;
    document.getElementById('loadBtn').onclick = loadSetup;
    document.getElementById('exportBtn').onclick = exportToExcel;
});
