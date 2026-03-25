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

