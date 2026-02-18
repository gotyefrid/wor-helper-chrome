(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    const delay = await CommonHelper.getAutoMoveDelay();
    const currentLocation = Territory.getCurrentLocation();
    const reloadDelay = await CommonHelper.getExtStorage('wor_map_reload_delay');

    if (reloadDelay) processReloadPage(reloadDelay);

    if (LOCATION_CONFIGS[String(currentLocation)]) {
        await processLocation(currentLocation, delay);
    } else if (currentLocation == 100) {
        await processBigTakt(delay);
    } else if (currentLocation == 101) {
        await processSmallTakt(delay);
    } else if (currentLocation == 102) {
        await processAnimeTakt(delay);
    }

    // Восстанавливаем кнопки после каждого AJAX-шага (сайт перезаписывает belowWrap)
    const belowWrap = document.getElementById('belowWrap');
    if (belowWrap && LOCATION_CONFIGS[String(currentLocation)]) {
        let isRestoring = false;
        new MutationObserver(async () => {
            if (isRestoring || document.querySelector('.menu_div [id^="to"]')) return;
            const actualLocation = Territory.getCurrentLocation();
            if (!LOCATION_CONFIGS[String(actualLocation)]) return;
            isRestoring = true;
            try {
                await restoreButtons(actualLocation, delay);
            } catch (e) {
                CommonHelper.log('Ошибка восстановления кнопок: ' + e.message);
            } finally {
                isRestoring = false;
            }
        }).observe(belowWrap, {childList: true});
    }
})();

// ─── Хелпер для teleport-колбэка ─────────────────────────────────────────────

function tpByRoom(room) {
    return () => {
        document.location = document.querySelector(`a[data-room="${room}"]`).href;
    };
}

// ─── Конфиги кнопок для каждой локации ───────────────────────────────────────

const LOCATION_CONFIGS = {
    '1': [
        {id: 765, label: 'Подземелье', icon: 'Icons/podzenelie.png', tp: tpByRoom(730)},
        {id: 510, label: 'Охотник', icon: 'Icons/ohotnik.png'},
        {id: 480, label: 'Дровосек', icon: 'Icons/drovosek.png'},
        {id: 674, label: 'Кристальный остров', icon: 'Icons/crystall.png', tp: tpByRoom(710)},
        {id: 442, label: 'Озеро', icon: 'Icons/ozero.png', tp: tpByRoom(407)},
    ],
    '2': [
        {id: 195, label: 'Хижина рыбака', icon: 'Icons/fishman.png'},
        {id: 301, label: 'Город', icon: 'Icons/gorod.png', tp: tpByRoom(322)},
        {id: 247, label: 'Пустыня', icon: 'Icons/pustinya.png', tp: tpByRoom(248)},
    ],
    '3': [
        {id: 164, label: 'Город', icon: 'Icons/gorod.png', tp: tpByRoom(132)},
        {id: 303, label: 'Катакомбы 1', icon: 'Icons/kat1.png', tp: tpByRoom(304)},
    ],
    '4': [
        {id: 101, label: 'Подземелье', icon: 'Icons/podzenelie.png', tp: tpByRoom(81)},
        {id: 108, label: 'Катакомбы 2', icon: 'Icons/kat2.png', tp: tpByRoom(90)},
    ],
    '5': [
        {id: 135, label: 'Чернокнижник', icon: 'Icons/chernoknizhnik.png'},
        {id: 161, label: 'Катакомбы 3', icon: 'Icons/kat3.png', tp: tpByRoom(185)},
        {id: 171, label: 'Катакомбы 1', icon: 'Icons/kat1.png', tp: tpByRoom(146)},
    ],
    '6': [
        {id: 308, label: 'Саванна', icon: 'Icons/savanna.png', tp: tpByRoom(309)},
        {id: 204, label: 'Катакомбы 2', icon: 'Icons/kat2.png', tp: tpByRoom(203)},
    ],
    '7': [
        {id: 284, label: 'Катакомбы 3', icon: 'Icons/kat3.png', tp: tpByRoom(228)},
        {id: 486, label: 'Катакомбы 4', icon: 'Icons/kat4.png', tp: tpByRoom(431)},
        {id: 1477, label: 'Логово', icon: 'Icons/podzenelie.png', tp: tpByRoom(1478)},
    ],
    '8': [
        {id: 352, label: 'Катакомбы 4', icon: 'Icons/kat4.png', tp: tpByRoom(324)},
        {id: 509, label: 'Озеро', icon: 'Icons/ozero.png', tp: tpByRoom(537)},
    ],
    '9': [
        {id: 226, label: 'Магазин кристаллов', icon: 'Icons/crystall.png'},
        {id: 116, label: 'Город', icon: 'Icons/gorod.png', tp: tpByRoom(93)},
    ],
    '10': [
        {id: 404, label: 'Саванна', icon: 'Icons/savanna.png', tp: tpByRoom(363)},
        {id: 297, label: 'Пустыня', icon: 'Icons/pustinya.png', tp: tpByRoom(256)},
    ],
};

// ─── Универсальные функции локаций ────────────────────────────────────────────

async function setupButtons(t, delay, walkAllMapStatus, configs) {
    const renderGrid = (json) => CommonHelper.renderGridInto(
        document.getElementById('gridA'), json.grid || []
    );

    const points = configs.map(({id, label, icon, tp}) => ({
        id, label, icon,
        action: async () => {
            await t.toPoint(id, delay, renderGrid, tp);
        }
    }));

    await moveOnDefaultMaps([...points, renderWalkAllMapButton(walkAllMapStatus, delay)]);
}

async function processLocation(location, delay) {
    const t = new Territory();
    const walkAllMapStatus = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');
    await setupButtons(t, delay, walkAllMapStatus, LOCATION_CONFIGS[String(location)]);

    if (walkAllMapStatus?.active === true && walkAllMapStatus?.location === Territory.getCurrentLocation()) {
        await walkAroundMap(delay);
    }
}

async function restoreButtons(location, delay) {
    const t = new Territory();
    const walkAllMapStatus = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');
    await setupButtons(t, delay, walkAllMapStatus, LOCATION_CONFIGS[String(location)]);
}

// ─── Общие утилиты ────────────────────────────────────────────────────────────

function processReloadPage(reloadDelay) {
    const delayStr = reloadDelay.trim();
    if (!delayStr || delayStr === '0') return;

    const parts = delayStr.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
    let delaySec;
    if (parts.length === 1) {
        delaySec = parts[0];
    } else if (parts.length === 2) {
        const [min, max] = [Math.min(...parts), Math.max(...parts)];
        delaySec = Math.random() * (max - min) + min;
    }

    if (delaySec > 0) {
        CommonHelper.log('Перезагружаем страницу через: ' + delaySec);
        setTimeout(() => CommonHelper.reloadPage(), delaySec * 1000);
    }
}

function renderWalkAllMapButton(walkAllMapStatus, delay) {
    return {
        id: 'all',
        icon: 'Icons/obhod.png',
        label: walkAllMapStatus?.active ? 'Остановить обход всех точек' : 'Запустить обход всех точек',
        action: async (e) => {
            const status = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');
            if (status?.active === true) {
                await CommonHelper.setExtStorage('wor_map_walk_all_map_active', {active: false});
                await CommonHelper.reloadPage();
                return;
            }
            await CommonHelper.setExtStorage('wor_map_walk_all_map_active', {
                active: true,
                location: Territory.getCurrentLocation()
            });
            e.target.innerHTML = e.target.innerHTML
                .replace('Запустить обход всех точек', 'Остановить обход всех точек')
                .replace('mini_karta', 'optsii_igroka');
            await walkAroundMap(delay);
        }
    };
}

async function walkAroundMap(delay = [50, 100]) {
    const t = new Territory();
    const visited = await CommonHelper.getExtStorage('visitedLocations') || {};
    const path = t.traverseAllPoints(visited[t.currentLocation] || []);
    path.shift();

    if (path.length === 0) {
        alert('Все точки уже посещены!');
        await CommonHelper.setExtStorage('wor_map_walk_all_map_active', {active: false});
        CommonHelper.reloadPage();
        return;
    }

    await t.moveByPath(
        path,
        delay,
        async (json) => {
            CommonHelper.renderGridInto(document.getElementById('gridA'),json.grid || []);

            const currentCell = json.grid.find(c => c.isCenter);

            if (currentCell) {
                const id = currentCell.room;
                visited[t.currentLocation] ??= [];
                if (!visited[t.currentLocation].includes(id)) {
                    visited[t.currentLocation].push(id);
                    await CommonHelper.setExtStorage('visitedLocations', visited);
                }
            }
        },
        async () => {
            await CommonHelper.setExtStorage('wor_map_walk_all_map_active', false);
            alert('Все клетки посещены');
            CommonHelper.reloadPage();
        }
    );
}

async function moveOnDefaultMaps(points) {
    const menuList = document.querySelector('.menu_div ul');
    points.forEach(({id, label, icon, action}) => {
        const imgUrl = icon ? chrome.runtime.getURL(icon) : '';
        const li = document.createElement('li');
        li.innerHTML = `
          <a href="#" id="to${id}">
            <img src="${imgUrl}" width="30" height="30" style="vertical-align:middle">
            ${label}
          </a>
        `;
        menuList.append(li);
        li.querySelector('a').addEventListener('click', async e => {
            e.preventDefault();
            await action(e);
        });
    });
}

// ─── Такт-локации ─────────────────────────────────────────────────────────────

async function processBigTakt(delay) {
    await processTaktCommon({
        744: 'Левая лесопилка', 778: 'Правая лесопилка',
        1094: 'Левая шахта', 1161: 'Правая шахта',
        710: 'Каменоломня', 311: 'Левая ферма', 328: 'Правая ферма'
    }, delay);
}

async function processSmallTakt(delay) {
    await processTaktCommon({
        205: 'Левая лесопилка', 217: 'Правая лесопилка',
        267: 'Шахта кристаллов', 429: 'Левая ферма', 441: 'Правая ферма'
    }, delay);
}

async function processAnimeTakt(delay) {
    await processTaktCommon({
        324: 'Левая лесопилка', 341: 'Правая лесопилка',
        334: 'Шахта кристаллов', 498: 'Левая ферма', 517: 'Правая ферма'
    }, delay);
}

async function processTaktCommon(baseNames, delay) {
    const t = new Territory();
    const container = document.querySelector('.contur');
    if (!container) return;

    // 1. Извлекаем номер нашей команды
    const teamMatch = container.textContent.match(/Вы в команде №(\d+)/);
    const myTeam = teamMatch ? parseInt(teamMatch[1], 10) : null;

    // Заменяем названия баз на кликабельные спаны
    for (const [pointId, name] of Object.entries(baseNames)) {
        container.innerHTML = container.innerHTML.replace(
            new RegExp(name + ':'),
            `<span class="clickable-base" data-point="${pointId}" style="cursor:pointer;">${name}</span>:`
        );
    }

    // Собираем все спаны в массив в порядке их появления
    const clickableSpans = Array.from(container.querySelectorAll('.clickable-base'));
    // Пронумеровываем их в тексте: [1] Левая лесопилка, [2] Правая лесопилка и т.д.
    clickableSpans.forEach((span, idx) => {
        span.textContent = `[${idx + 1}] ${span.textContent}`;
    });

    // Вешаем клики на каждый
    clickableSpans.forEach(span => {
        span.addEventListener('click', async e => {
            const el = e.currentTarget;
            const pointId = parseInt(el.getAttribute('data-point'), 10);
            const baseName = baseNames[pointId];

            const nextElem = el.nextElementSibling;
            const m0 = nextElem?.textContent.match(/№(\d+)/);
            // 2. Определяем, была ли база наша уже в момент клика
            const initialOurs = m0 && myTeam !== null && parseInt(m0[1], 10) === myTeam;

            // 3. Бежим к точке
            await t.toPoint(pointId, delay, doc => {
                if (initialOurs) {
                    document.body.innerHTML = doc.querySelector('body').innerHTML;
                    return;
                }
                const newCont = doc.querySelector('.contur');
                if (newCont && myTeam !== null) {
                    const re = new RegExp(
                        baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':[\\s\\S]*?№(\\d+)', 'i'
                    );
                    const m = newCont.innerHTML.match(re);
                    if (m && parseInt(m[1], 10) === myTeam) return CommonHelper.reloadPage();
                }
                document.body.innerHTML = doc.querySelector('body').innerHTML;
            });
        });
    });

    // Привязка нажатий клавиш 1–9 к индексам в clickableSpans
    document.addEventListener('keydown', e => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        const idx = Number(e.key) - 1;
        if (!isNaN(idx) && idx >= 0 && idx < clickableSpans.length) clickableSpans[idx].click();
    });
}
