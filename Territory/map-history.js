start();

async function start() {
    let access = await chrome.storage.local.get(["wor_maphistory_active"]);

    if (!access.wor_maphistory_active) {
        return;
    }

    let r = await chrome.storage.local.get(["visitedLocations"]);
    let visitedLocations = r.visitedLocations || {};

    trackPosition(visitedLocations);
}


function getCurrentLocation() {
    const link = document.querySelector('a[href*="l="]');

    if (link) {
        const urlParams = new URLSearchParams(link.href.split('?')[1]);
        const lValue = urlParams.get("l");
        return lValue;
    }

    return null;
}


function highlightVisited(visitedLocations) {
    injectHighlightStyles(); // один раз при загрузке
    let currentLocation = getCurrentLocation();
    if (!currentLocation || !visitedLocations[currentLocation]) return;

    visitedLocations[currentLocation].forEach(id => {
        let visitedElement = document.getElementById(id);
        if (visitedElement) {
            visitedElement.classList.add("visited-highlight");
        }
    });
}


function injectHighlightStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .visited-highlight {
            position: relative !important;
        }
        .visited-highlight::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            z-index: 10;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

function trackPosition(visitedLocations) {
    let currentLocation = getCurrentLocation();
    if (!currentLocation) return;

    let currentCell = document.querySelector("td[style*='background-color: #00CC00'] div");
    if (currentCell) {
        let currentId = currentCell.id;

        if (!visitedLocations[currentLocation]) {
            visitedLocations[currentLocation] = [];
        }

        if (!visitedLocations[currentLocation].includes(currentId)) {
            visitedLocations[currentLocation].push(currentId);
            chrome.storage.local.set({ ["visitedLocations"]: visitedLocations });
        }
    }
    highlightVisited(visitedLocations);

    // ==UserScript==
    // @name         Map Collector 5×5 (multi‑location)
    // @match        *://*/teritory.php*
    // @run-at       document-end
    // ==/UserScript==
    (() => {
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
    })();
}

