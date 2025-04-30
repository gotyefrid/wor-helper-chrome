const MAP_2_OZERO = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 135, 136, 0, 0, 0, 140, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 156, 157, 158, 0, 0, 161, 162, 0, 0, 0],
    [0, 0, 0, 0, 0, 177, 178, 179, 180, 181, 182, 0, 0, 0, 0],
    [0, 0, 195, 196, 197, 0, 199, 0, 201, 202, 203, 0, 0, 0, 0],
    [0, 0, 216, 217, 218, 0, 220, 221, 0, 223, 224, 0, 0, 0, 0],
    [0, 0, 237, 238, 0, 0, 241, 242, 243, 244, 245, 246, 247, 0, 0],
    [0, 0, 258, 259, 0, 0, 262, 263, 264, 265, 0, 0, 0, 0, 0],
    [0, 0, 279, 280, 281, 282, 283, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 301, 302, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 323, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const MAP_1_GOROD = [
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
const MAP_6_KAT3 = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 204, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 224, 225, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 242, 243, 244, 0, 0, 0, 0, 249, 250, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 262, 263, 264, 265, 266, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 283, 284, 285, 0, 287, 288, 289, 290, 291, 0, 0, 0, 295, 296, 0, 0, 299, 300, 301, 302, 303, 304, 305, 306, 307, 308, 0, 0],
    [0, 0, 0, 0, 322, 323, 324, 325, 326, 327, 328, 329, 0, 0, 0, 333, 334, 335, 336, 337, 338, 339, 0, 0, 0, 0, 344, 345, 346, 0, 0, 0],
    [0, 0, 0, 360, 361, 362, 363, 364, 365, 366, 367, 368, 0, 0, 0, 0, 373, 374, 375, 376, 377, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 398, 399, 400, 401, 402, 403, 404, 405, 406, 407, 0, 0, 410, 411, 412, 413, 414, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 437, 438, 439, 0, 0, 0, 443, 444, 445, 446, 447, 448, 449, 450, 451, 452, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 485, 486, 0, 0, 489, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
const MAP_5_KAT2 = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 120, 0, 0, 0],
    [0, 0, 0, 0, 133, 134, 135, 136, 137, 0, 0, 0, 0, 0, 0, 0, 145, 0, 0, 0],
    [0, 0, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 0, 0],
    [0, 0, 181, 182, 183, 184, 0, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 0, 0],
    [0, 0, 206, 207, 208, 209, 210, 211, 212, 213, 214, 215, 216, 217, 218, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 238, 239, 240, 241, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 264, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
const MAP_4_KAT1 = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 83, 84, 85, 0, 87, 88, 89, 0, 0, 0],
    [0, 0, 0, 101, 102, 103, 104, 105, 106, 107, 108, 109, 0, 0],
    [0, 0, 119, 120, 121, 122, 123, 0, 125, 126, 127, 0, 0, 0],
    [0, 0, 138, 139, 140, 141, 142, 143, 144, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 162, 163, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

/* ===== 1. Карты локаций =================================== */
// подключайте сюда новые карты по мере надобности
const LOCATION_MAPS = {
    "1": MAP_1_GOROD,
    "2": MAP_2_OZERO,
    "4": MAP_4_KAT1,
    "5": MAP_5_KAT2,
    "6": MAP_6_KAT3,
};

/* ===== 2. CSS для точек =================================== */
function injectHighlightStyles() {
    // чтобы не дублировать <style> при каждом вызове
    if (document.getElementById("mp-hl-style")) return;

    const style = document.createElement("style");
    style.id = "mp-hl-style";
    style.textContent = `
        .unvisited-highlight,
        .visited-highlight {
            position: relative !important;
        }
        .unvisited-highlight::after,
        .visited-highlight::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
            height: 10px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10;
        }
        .unvisited-highlight::after { background: red;   }
        .visited-highlight::after   { background: white; }
    `;
    document.head.appendChild(style);
}

/* ===== 3. Раскраска карты ================================= */
function highlightPoints(visitedLocations) {
    injectHighlightStyles();
    const loc = getCurrentLocation();
    const map = LOCATION_MAPS[loc];

    // если для локации нет карты – работаем «по-старому»
    if (!map) {
        highlightVisited(visitedLocations);
        return;
    }

    const visited = new Set((visitedLocations[loc] || []).map(String));

    map.flat().forEach(id => {
        if (id === 0) return;                               // непроходимая клетка
        const el = document.getElementById("r" + id);
        if (!el) return;

        if (visited.has(String(id))) {
            el.classList.remove("unvisited-highlight");
            el.classList.add("visited-highlight");
        } else {
            el.classList.add("unvisited-highlight");
        }
    });
}

/* ===== 4. Инициализация =================================== */
start();
async function start() {
    const { wor_maphistory_active } =
        await chrome.storage.local.get(["wor_maphistory_active"]);
    if (!wor_maphistory_active) return;

    const { visitedLocations = {} } =
        await chrome.storage.local.get(["visitedLocations"]);

    // сразу подсвечиваем всю карту
    highlightPoints(visitedLocations);

    // дальше слушаем перемещения
    trackPosition(visitedLocations);
    collectMap();
}

/* ===== 5. Трекинг шага героя ============================== */
function trackPosition(visitedLocations) {
    const loc = getCurrentLocation();
    if (!loc) return;

    // «зелёная» клетка, на которой стоит герой
    const currentCell = document.querySelector(
        "td[style*='background-color: #00CC00'] div"
    );
    if (currentCell) {
        const id = currentCell.id.replace("r", "");

        visitedLocations[loc] ??= [];

        if (!visitedLocations[loc].includes(id)) {
            visitedLocations[loc].push(id);
            chrome.storage.local.set({ visitedLocations });
        }
    }

    // перекрашиваем актуально
    highlightPoints(visitedLocations);
}

/* ===== 6. Старая подсветка «только посещённых» ============ */
/* Оставлена на случай локаций без карты. */
function highlightVisited(visitedLocations) {
    injectHighlightStyles();
    const loc = getCurrentLocation();
    if (!loc || !visitedLocations[loc]) return;

    visitedLocations[loc].forEach(id => {
        const el = document.getElementById("r" + id);
        if (el) el.classList.add("visited-highlight");
    });
}

/* ===== 7. Вспомогалка для URL ============================= */
function getCurrentLocation() {
    const link = document.querySelector('tbody a[href*="l="]');
    if (!link) return null;

    const params = new URLSearchParams(link.href.split("?")[1]);
    return params.get("l");
}

// ==UserScript==
// @name         Map Collector 5×5 (multi‑location)
// @match        *://*/teritory.php*
// @run-at       document-end
// ==/UserScript==
function collectMap() {
    /* ------------------------------------------ *
     *            НАСТРОЙКИ И СЕРВИС              *
     * ------------------------------------------ */
    const GRID = 5;                          // размер видимой сетки
    const $ = (sel, ctx = document) => ctx.querySelector(sel);

    /* —— 1.  Узнаём ID текущей локации (парам‑р “l”) —— */
    const firstLink = $('a[id^="r"]');
    if (!firstLink) return;                  // на странице нет сетки

    const locId = new URL(firstLink.href, location.href)
        .searchParams.get('l') || 'unknown';
    const STORAGE_KEY = `worldMap:${locId}`;

    /* —— 2.  Собираем 5×5 id из DOM —— */
    const rows = [...document.querySelectorAll('tbody > tr')].slice(0, GRID);
    if (rows.length !== GRID) return;        // защита от неверной разметки

    const grid = rows.map(tr =>
        [...tr.children].slice(0, GRID).map(td => {
            const cell = td.querySelector('[id^="r"]');
            return cell ? +cell.id.slice(1) : null;   // null, если id нет
        })
    );

    /* —— 3.  Определяем вертикальный шаг (vStride) —— */
    // горизонтальный stride всегда = 1 (id растут слева‑направо)
    const rawDiffs = [];
    for (let c = 0; c < GRID; c++) {
        if (grid[1][c] != null && grid[0][c] != null)
            rawDiffs.push(grid[1][c] - grid[0][c]);
    }
    const vStride = rawDiffs[0];            // во всех колонках одинаковый  
    if (!vStride) return;                   // что‑то пошло не так

    /* —— 4.  Загружаем/инициализируем объект локации —— */
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!store.vStride) store.vStride = vStride;
    if (!store.cells) store.cells = {};   // id -> {x,y}

    // если по какой‑то причине шаг изменился – начинаем карту заново
    if (store.vStride !== vStride) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
        return;
    }

    /* —— 5.  Вспом. функции —— */
    const posOf = id => ({                   // (x,y) в «бесконечной» сетке
        x: id % vStride,
        y: Math.floor(id / vStride)
    });

    const writeCell = id => {
        const { x, y } = posOf(id);
        store.cells[id] = { x, y };

        store.minX = store.minX === undefined ? x : Math.min(store.minX, x);
        store.maxX = store.maxX === undefined ? x : Math.max(store.maxX, x);
        store.minY = store.minY === undefined ? y : Math.min(store.minY, y);
        store.maxY = store.maxY === undefined ? y : Math.max(store.maxY, y);
    };

    /* —— 6.  Вносим все видимые id в хранилище —— */
    grid.flat().filter(Boolean).forEach(writeCell);

    /* —— 7.  Пересобираем двумерный массив карты —— */
    const W = store.maxX - store.minX + 1;
    const H = store.maxY - store.minY + 1;
    const mapArray = Array.from({ length: H }, () => Array(W).fill(0));

    Object.entries(store.cells).forEach(([id, { x, y }]) => {
        mapArray[y - store.minY][x - store.minX] = +id;
    });

    store.map = mapArray;        // «человеческая» карта
    store.updated = Date.now();

    /* —— 8.  Сохраняем в localStorage (только текущую локацию) —— */
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

    /* —— 9.  (опция) полезный лог для отладки —— */
    console.log(`✓ map (${locId}) updated, known cells:`,
        Object.keys(store.cells).length);
    // console.table(mapArray);       // раскомментируйте, если хотите видеть карту
}

/**
 * Оставляет на карте только разрешённые точки.
 *
 * @param {number[][]} grid   – исходная карта (2-D массив чисел)
 * @param {(number|string)[]} allowedIds – массив ID, на которые можно наступить
 * @returns {number[][]}      – новая карта с «обнулёнными» запрещёнными клетками
 */
function filterMap(grid, allowedIds) {
    // приводим разрешённые ID к числам и кладём в Set для O(1)-проверки
    const allowed = new Set(
      allowedIds.map(id => typeof id === 'string' ? Number(id) : id)
    );
  
    // возвращаем новую карту, не мутируя оригинал
    return grid.map(row =>
      row.map(cell => (allowed.has(cell) ? cell : 0))
    );
  }
  
//   /* ===== пример использования ===== */
//   const originalMap = [
//     [0, 124, 125],
//     [162, 163, 0],
//     [201, 204, 205]
//   ];
  
//   const walkableIds = ['124', 204, 205];
  
//   const filtered = filterMap(originalMap, walkableIds);
//   console.log(filtered);
//   // → [ [0, 124, 0], [0, 0, 0], [0, 204, 205] ]