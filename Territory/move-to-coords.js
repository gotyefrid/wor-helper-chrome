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
                if (this.grid[row][col] === id) return {row, col};
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
            {dr: -1, dc: 0},  // вверх
            {dr: 1, dc: 0},   // вниз
            {dr: 0, dc: -1},  // влево
            {dr: 0, dc: 1},   // вправо
            {dr: -1, dc: -1}, // диагональ вверх-влево
            {dr: -1, dc: 1},  // диагональ вверх-вправо
            {dr: 1, dc: -1},  // диагональ вниз-влево
            {dr: 1, dc: 1}    // диагональ вниз-вправо
        ];

        const visited = Array.from({length: this.numRows}, () =>
            Array(this.numCols).fill(false)
        );
        const parent = Array.from({length: this.numRows}, () =>
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
            for (const {dr, dc} of directions) {
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
                    queue.push({row: newRow, col: newCol});
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

async function go() {

    let icame = localStorage.getItem('iamcame');

    if (icame) {
        return;
    }

    if (document.location.href.includes('main') || document.location.href.includes('gorod')) {
        localStorage.setItem('visitedPathIds', '[]');
        let priroda = document.querySelector('a[href*=teritory]');

        if (priroda) {
            console.log('Кликаем на природу')
            await delay(2000);
            priroda.click();
            return;
        }
    }

    if (document.location.href.includes('teritory')) {
        let playerCell = document.querySelector("td[align=center]").querySelector('div');
        let currentId = parseInt(playerCell.id.substring(1), 10);

        if (currentId !== 394 && localStorage.getItem('visitedPathIds') === '[]') {
            console.log('Не на старте мы, кликаем на телепорт')
            await delay(2000);
            document.querySelector('a[href*=teleport]').click();
            return;
        }


        navigatePath();

    }
}

async function navigatePath() {
    const navigator = new GridNavigator(location1Ids);
    const path = navigator.findPath(395, 730);
    console.log('Путь:', path);

    // Получаем массив пройденных точек из localStorage или создаем пустой, если его ещё нет
    let visitedPathIds = JSON.parse(localStorage.getItem('visitedPathIds') || '[]');

    // Для первой итерации будем использовать текущий document
    let currentDocument = document;

    // Проходим по всем точкам пути
    for (const id of path) {
        // Если текущая точка не была посещена
        if (!visitedPathIds.includes(id)) {
            console.log('Переходим на точку ' + id);
            await delay(getRandomNumber(50, 150)); // задержка между запросами

            // Добавляем id в массив пройденных точек и сохраняем его в localStorage
            visitedPathIds.push(id);
            localStorage.setItem('visitedPathIds', JSON.stringify(visitedPathIds));

            // Формируем селектор для ячейки и ищем её в текущем документе (полученном на предыдущем шаге или изначальном)
            let cellId = '#r' + id.toString();
            let cellElement = currentDocument.querySelector(cellId);
            if (!cellElement) {
                console.error('Элемент с селектором ' + cellId + ' не найден в текущем документе');
                localStorage.setItem('visitedPathIds', '[]');
                break;
            }

            // Получаем URL из атрибута href найденного элемента
            let url = cellElement.getAttribute('href');
            console.log('Отправляем fetch запрос по URL: ' + url);

            try {
                // Отправляем запрос и получаем HTML-страницу
                let response = await fetch(url);
                let html = await response.text();

                // Парсим полученный HTML и создаём новый DOM
                let parser = new DOMParser();
                let newDocument = parser.parseFromString(html, 'text/html');
                console.log('Получена страница с заголовком: ' + newDocument.title);

                // Обновляем currentDocument для следующей итерации
                currentDocument = newDocument;
            } catch (error) {
                console.error('Ошибка при fetch запросе:', error);
                break;
            }

            // Если достигнута финальная точка, перезагружаем страницу
            if (id === path[path.length - 1]) {
                console.log('Достигнута финальная точка, перезагружаем страницу...');
                localStorage.setItem('visitedPathIds', '[]');
                localStorage.setItem('iamcame', 1);
                location.reload();
                return;
            }
        }
    }
}


