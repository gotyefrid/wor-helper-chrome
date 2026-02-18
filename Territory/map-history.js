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
    const map = Territory.LOCATION_MAPS[loc];

    // если для локации нет карты – работаем «по-старому»
    if (!map) {
        highlightVisited(visitedLocations);
        return;
    }

    const visited = new Set((visitedLocations[loc] || []).map(String));

    map.flat().forEach(id => {
        if (id === 0) return;                               // непроходимая клетка
        const el = document.querySelector('div[data-room="' + id + '"]');
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
    // collectMap();
}

/* ===== 5. Трекинг шага героя ============================== */
function trackPosition(visitedLocations) {
    const loc = getCurrentLocation();
    if (!loc) return;

    // «зелёная» клетка, на которой стоит герой
    const currentCell = document.querySelector('.map-cell:empty');

    if (currentCell) {
        const id = currentCell.dataset.room;

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
        const el = document.querySelector('div[data-room="' + id + '"]');
        if (el) el.classList.add("visited-highlight");
    });
}

/* ===== 7. Вспомогалка для URL ============================= */
function getCurrentLocation() {
    return Territory.getCurrentLocation();
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