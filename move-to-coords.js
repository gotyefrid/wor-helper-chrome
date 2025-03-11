class GridNavigator {
    constructor(grid) {
        this.grid = grid;
        this.numRows = grid.length;
        this.numCols = grid[0].length;
    }

    // Метод для поиска координат по заданному id
    findCoordinatesById(id) {
        for (let row = 0; row < this.numRows; row++) {
            for (let col = 0; col < this.numCols; col++) {
                if (this.grid[row][col] === id) return { row, col };
            }
        }
        return null;
    }

    // Метод для поиска кратчайшего пути от startId до targetId
    findPath(startId, targetId) {
        const start = this.findCoordinatesById(startId);
        const target = this.findCoordinatesById(targetId);

        if (!start || !target) {
            console.error("Начальная или конечная точка не найдена в сетке.");
            return [];
        }

        // Возможные направления движения (8 направлений: вверх, вниз, влево, вправо и диагонали)
        const directions = [
            { dr: -1, dc: 0 },  // вверх
            { dr: 1, dc: 0 },   // вниз
            { dr: 0, dc: -1 },  // влево
            { dr: 0, dc: 1 },   // вправо
            { dr: -1, dc: -1 }, // диагональ вверх-влево
            { dr: -1, dc: 1 },  // диагональ вверх-вправо
            { dr: 1, dc: -1 },  // диагональ вниз-влево
            { dr: 1, dc: 1 }    // диагональ вниз-вправо
        ];

        const visited = Array.from({ length: this.numRows }, () =>
            Array(this.numCols).fill(false)
        );
        const parent = Array.from({ length: this.numRows }, () =>
            Array(this.numCols).fill(null)
        );
        const queue = [];

        queue.push(start);
        visited[start.row][start.col] = true;

        while (queue.length > 0) {
            const current = queue.shift();

            // Если достигли целевой точки, восстанавливаем путь
            if (current.row === target.row && current.col === target.col) {
                const pathCoords = [];
                let cell = current;
                while (cell) {
                    pathCoords.push(cell);
                    cell = parent[cell.row][cell.col];
                }
                pathCoords.reverse();
                // Преобразуем координаты в id клеток
                return pathCoords.map(cell => this.grid[cell.row][cell.col]);
            }

            // Перебираем все соседние клетки
            for (const { dr, dc } of directions) {
                const newRow = current.row + dr;
                const newCol = current.col + dc;

                if (
                    newRow >= 0 && newRow < this.numRows &&
                    newCol >= 0 && newCol < this.numCols &&
                    !visited[newRow][newCol] &&
                    this.grid[newRow][newCol] !== 0
                ) {
                    visited[newRow][newCol] = true;
                    parent[newRow][newCol] = current;
                    queue.push({ row: newRow, col: newCol });
                }
            }
        }

        console.warn("Путь не найден");
        return [];
    }
}

const location1Ids = [
    [0, 0, 0, 394, 395, 396, 0, 0, 0, 0, 0, 0, 403, 404, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 429, 430, 431, 432, 433, 0, 0, 0, 437, 438, 0, 0, 0, 442, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 466, 467, 468, 0, 470, 471, 472, 473, 474, 0, 0, 477, 478, 479, 480, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 536, 537, 538, 539, 540, 541, 542, 543, 544, 545, 546, 547, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 572, 573, 574, 575, 576, 577, 578, 579, 580, 581, 582, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [601, 602, 603, 604, 0, 606, 607, 608, 609, 610, 611, 612, 0, 614, 615, 616, 0, 0, 0, 0, 0, 0, 623, 624, 0, 0],
    [636, 637, 638, 639, 640, 641, 642, 643, 644, 645, 646, 0, 0, 0, 650, 651, 0, 0, 0, 0, 0, 0, 658, 659, 660, 0],
    [0, 0, 0, 0, 674, 675, 0, 0, 678, 679, 0, 0, 0, 0, 0, 686, 687, 0, 0, 0, 0, 0, 693, 694, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 721, 722, 723, 0, 0, 0, 0, 728, 0, 730, 731],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 758, 759, 760, 761, 762, 763, 764, 765, 766],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 793, 0, 0, 796, 797, 798, 799, 0, 0]
];
const navigator = new GridNavigator(location1Ids);
const path = navigator.findPath(636, 660, 1);
console.log(path); // Ожидаемый маршрут: [511, 512, 513, 514, 323, 516]


