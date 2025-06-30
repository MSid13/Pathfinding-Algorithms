export class Pathfinder {
    constructor(grid, heuristicFn) {
        this.grid = grid;
        this.heuristic = heuristicFn;
        this.nodesVisited = 0;
        this.distanceTraveled = 0;
    }
    run(start, end, onStep, onFinish) {
        for (let i = 0; i < this.grid.rows; i++) {
            for (let j = 0; j < this.grid.cols; j++) {
                const cell = this.grid.grid[i][j];
                cell.g = Infinity;
                cell.f = Infinity;
                cell.h = 0;
                cell.parent = null;
            }
        }
        

        start.g = 0;
        start.f = this.heuristic(start, end);
        start.color = "green";
        end.color = "red";
        const openSet = [start];
        this.nodesVisited = 0;
        this.distanceTraveled = 0;


        const getNeighbors = (cell) => {
            let neighbors = [];
            let directions = [ //possible directions of travel including diagonals
                { row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 },
                { row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }
            ];
            for (let dir of directions) {
                let dx = dir.row, dy = dir.col;
                const r = cell.row + dx, c = cell.col + dy;
                if (r >= 0 && r < this.grid.rows && c >= 0 && c < this.grid.cols) {
                    const neighbor = this.grid.grid[r][c];
                    if (neighbor.isWall) continue;
                    if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                        if (this.grid.grid[cell.row][cell.col + dy]?.isWall || this.grid.grid[cell.row + dx][cell.col]?.isWall) continue;
                    }
                    neighbors.push(neighbor);
                }
            }
            return neighbors;


        };
        const calculateCosts = (current, neighbor, end) => { //Calculating the costs of moving to a neighbor
            const dx = Math.abs(neighbor.row - current.row);
            const dy = Math.abs(neighbor.col - current.col);
            const stepCost = (dx === 1 && dy === 1) ? Math.SQRT2 : 1; // diagonal moves cost more
            const tempG = current.g + stepCost * neighbor.weight;
            const h = this.heuristic(neighbor, end); //heuristic cost
            const f = tempG + h; //total cost
            return { tempG, h, f };
        };
        const step = () => {
            if (openSet.length === 0) {
                onFinish(false, this.nodesVisited, 'No path');
                return;
            }
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            this.nodesVisited++;
            if (current === end) {
                this.distanceTraveled = current.g;
                onFinish(true, this.nodesVisited, this.distanceTraveled.toFixed(2));
                return;
            }
            for (const neighbor of getNeighbors(current)) {
                const { tempG, h, f } = calculateCosts(current, neighbor, end);
                if (tempG < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = tempG;
                    neighbor.h = h;
                    neighbor.f = f;
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        neighbor.color = "yellow";
                    }
                }
            }
            if (current !== start) current.color = "blue";
            start.color = "green";
            end.color = "red";
            if (onStep) onStep();
            requestAnimationFrame(step);
        };
        step();
   }
    // Async version for ML heuristic
    async runAsync(start, end, onStep, onFinish) {
        for (let i = 0; i < this.grid.rows; i++) {
            for (let j = 0; j < this.grid.cols; j++) {
                const cell = this.grid.grid[i][j];
                cell.g = Infinity;
                cell.f = Infinity;
                cell.h = 0;
                cell.parent = null;
            }
        }
        start.g = 0;
        start.f = await this.heuristic(start, end);
        start.color = "green";
        end.color = "red";
        const openSet = [start];
        this.nodesVisited = 0;
        this.distanceTraveled = 0;
        const getNeighbors = (cell) => {
            let neighbors = [];
            let directions = [
                { row: -1, col: 0 }, { row: 1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 1 },
                { row: -1, col: -1 }, { row: -1, col: 1 }, { row: 1, col: -1 }, { row: 1, col: 1 }
            ];
            for (let dir of directions) {
                let dx = dir.row, dy = dir.col;
                const r = cell.row + dx, c = cell.col + dy;
                if (r >= 0 && r < this.grid.rows && c >= 0 && c < this.grid.cols) {
                    const neighbor = this.grid.grid[r][c];
                    if (neighbor.isWall) continue;
                    if (Math.abs(dx) === 1 && Math.abs(dy) === 1) {
                        if (this.grid.grid[cell.row][cell.col + dy]?.isWall || this.grid.grid[cell.row + dx][cell.col]?.isWall) continue;
                    }
                    neighbors.push(neighbor);
                }
            }
            return neighbors;
        };
        const calculateCosts = async (current, neighbor, end) => {
            const dx = Math.abs(neighbor.row - current.row);
            const dy = Math.abs(neighbor.col - current.col);
            const stepCost = (dx === 1 && dy === 1) ? Math.SQRT2 : 1;
            const tempG = current.g + stepCost * neighbor.weight;
            const h = await this.heuristic(neighbor, end);
            const f = tempG + h;
            return { tempG, h, f };
        };
        const step = async () => {
            if (openSet.length === 0) {
                onFinish(false, this.nodesVisited, 'No path');
                return;
            }
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            this.nodesVisited++;
            if (current === end) {
                this.distanceTraveled = current.g;
                onFinish(true, this.nodesVisited, this.distanceTraveled.toFixed(2));
                return;
            }
            for (const neighbor of getNeighbors(current)) {
                const { tempG, h, f } = await calculateCosts(current, neighbor, end);
                if (tempG < neighbor.g) {
                    neighbor.parent = current;
                    neighbor.g = tempG;
                    neighbor.h = h;
                    neighbor.f = f;
                    if (!openSet.includes(neighbor)) {
                        openSet.push(neighbor);
                        neighbor.color = "yellow";
                    }
                }
            }
            if (current !== start) current.color = "blue";
            start.color = "green";
            end.color = "red";
            if (onStep) onStep();
            setTimeout(step, 0); // async step
        };
        await step();
    }
}



let mlModel = null;
export async function loadMLModel() {
    if (!mlModel) {
        mlModel = await window.tf.loadGraphModel('web_model/model.json?v=' + Date.now());
        if (mlModel && mlModel.weights && mlModel.weights.length) {
            console.log("Loaded model weights count:", mlModel.weights.length);
        }
        //debug
        if (mlModel && mlModel.inputs) {
            console.log("Model input names:", mlModel.inputs.map(x => x.name));
        }
    }
    return mlModel;
}

export async function mlHeuristic(a, b, grid) {
    await loadMLModel();
    // prepare grid tensor: shape [1, 20, 20, 1], value 0/1
    const gridArr = [];
    for (let i = 0; i < grid.length; i++) {
        const row = [];
        for (let j = 0; j < grid[0].length; j++) {
            row.push(grid[i][j].isWall ? 1 : 0);
        }
        gridArr.push(row);
    }
    const gridTensor = window.tf.tensor(gridArr).reshape([1, grid.length, grid[0].length, 1]);
    // prepare start/goal tensor: shape [1, 4], normalized
    const startGoalArr = [
        a.row / (grid.length - 1),
        a.col / (grid[0].length - 1),
        b.row / (grid.length - 1),
        b.col / (grid[0].length - 1)
    ];
    const startGoalTensor = window.tf.tensor(startGoalArr).reshape([1, 4]);

    console.log('gridTensor shape:', gridTensor.shape, 'startGoalTensor shape:', startGoalTensor.shape);
    let output;
    if (mlModel.predict) {
        output = mlModel.predict([startGoalTensor, gridTensor]); // order must match model input order
    } else {
        const inputNames = mlModel.inputs.map(x => x.name);
        const inputDict = {};
        inputDict[inputNames[0]] = startGoalTensor;
        inputDict[inputNames[1]] = gridTensor;
        output = mlModel.execute(inputDict);
    }
    const normResidual = (await output.data())[0];
    gridTensor.dispose();
    startGoalTensor.dispose();
    output.dispose();
   
    const maxCost = Math.SQRT2 * (grid.length - 1);
    const dx = Math.abs(a.row - b.row);
    const dy = Math.abs(a.col - b.col);
    const octile = Math.min(dx, dy) * Math.SQRT2 + Math.abs(dx - dy);
    const predictedCost = normResidual * maxCost + octile;
    //never overestimate
    const admissibleCost = Math.min(predictedCost, octile);
    //debug stuff
    console.log("ML residual (norm):", normResidual, "predicted cost:", predictedCost, "octile:", octile, "admissible:", admissibleCost);
    return admissibleCost;
}

export function AstarHeuristic(a, b) {
    const dx = Math.abs(a.row - b.row);
    const dy = Math.abs(a.col - b.col);
    const D = 1;
    const D2 = Math.SQRT2;
    
    return D * (dx + dy) + (D2 - 2 * D) * Math.min(dx, dy);
}

export function dijkastraHeuristic(a,b) {
    return 0;
}

export function greedyHeuristic(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

