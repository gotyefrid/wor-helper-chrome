async function handleAutoTakt(baseNames, container, myTeam, t, delay) {
    const taktActive = await CommonHelper.getExtStorage('wor_takt_active');
    const showButton = await CommonHelper.getExtStorage('wor_takt_opt_active_button');

    if (showButton) {
        CommonHelper.createDisableButton(
            taktActive ? 'Остановить авто-такт' : 'Включить авто-такт',
            async () => {
                await CommonHelper.setExtStorage('wor_takt_active', !taktActive);
                CommonHelper.reloadPage();
            }
        );
    }

    if (!taktActive) return;

    if (myTeam === null) {
        CommonHelper.log('Авто-такт: не удалось определить номер команды, пропускаем');
        return;
    }

    // Парсим состояние баз ДО того как processTaktCommon изменит innerHTML
    const bases = parseTaktBases(baseNames, container);
    await runAutoTakt(t, bases, myTeam, delay, baseNames);
}

function parseTaktBases(baseNames, container) {
    return parseTaktBasesFromHtml(baseNames, container.innerHTML);
}

/**
 * Парсит состояние баз из HTML-строки (например, из json.belowHtml или container.innerHTML).
 *
 * @param {Object} baseNames - Маппинг pointId → название базы: { 205: 'Левая лесопилка', ... }
 * @param {string} html - HTML-строка с блоком информации о тактическом сражении.
 * @returns {{ id: number, name: string, team: number|null }[]} Массив баз с их текущим владельцем.
 *   team: null означает нейтральную базу.
 */
function parseTaktBasesFromHtml(baseNames, html) {
    const bases = [];

    for (const [pointId, name] of Object.entries(baseNames)) {
        // Ищем паттерн "Название:<span ...>№N</span>"
        const regex = new RegExp(name + ':<span[^>]*>№(\\d+)<\\/span>');
        const match = html.match(regex);
        bases.push({
            id: parseInt(pointId),
            name,
            team: match ? parseInt(match[1]) : null  // null = нейтральная
        });
    }

    return bases;
}

/**
 * Строит маппинг имя_игрока → номер_команды из HTML-строки с блоком тактического сражения.
 * Используется для определения, является ли конкретный игрок союзником или противником.
 *
 * @param {string} html - HTML-строка (например json.belowHtml) содержащая блоки
 *   "Команда №N:" со ссылками на игроков вида <a href="...name=PlayerName&...">
 * @returns {Map<string, number>} Маппинг: имя игрока → номер команды.
 */
function parsePlayerTeams(html) {
    const teams = new Map();
    const teamRegex = /Команда №(\d+):<\/span>[\s\S]*?(?=<span class="svet">Команда|$)/g;

    let match;
    while ((match = teamRegex.exec(html)) !== null) {
        const teamNum = parseInt(match[1]);
        // Извлекаем имена из href: infouser.php?name=PlayerName&...
        for (const [, name] of match[0].matchAll(/name=([^&"]+)/g)) {
            teams.set(decodeURIComponent(name), teamNum);
        }
    }

    return teams;
}

/**
 * Извлекает список имён игроков из строки вида "Имя1 [25], Имя2 [30]".
 *
 * @param {string} namesStr - Строка из поля names объекта players в ответе сервера.
 * @returns {string[]} Массив чистых имён без уровней.
 */
function extractPlayerNames(namesStr) {
    return namesStr.split(',').map(s => s.trim().replace(/\s*\[\d+\]\s*$/, '').trim()).filter(Boolean);
}

async function runAutoTakt(t, bases, myTeam, delay, baseNames) {
    // Цели: базы не под контролем нашей команды (нейтральные или вражеские)
    const targets = bases.filter(b => b.team !== myTeam);

    if (targets.length === 0) {
        CommonHelper.log('Авто-такт: все базы захвачены командой №' + myTeam + ', ждём...');
        await CommonHelper.delay(1000, 2000);
        CommonHelper.reloadPage();
        return;
    }

    const randomMode = await CommonHelper.getExtStorage('wor_takt_random');
    let target;

    if (randomMode !== false) {
        // Случайный выбор цели из доступных
        target = targets[Math.floor(Math.random() * targets.length)];
    } else {
        // Выбираем ближайшую базу по длине пути
        let minLen = Infinity;
        for (const b of targets) {
            const path = t.findPath(t.currentPointId, b.id);
            if (path.length > 0 && path.length < minLen) {
                minLen = path.length;
                target = b;
            }
        }
        if (!target) target = targets[0];
    }

    CommonHelper.log('Авто-такт: идём к базе "' + target.name + '" (команда: ' + (target.team ?? 'нейтральная') + ')');

    const renderGrid = (json) => CommonHelper.renderMiniGridInto(
        document.getElementById('gridA'), json.grid || []
    );

    // getBlockedIds: блокируем только клетки с ВРАЖЕСКИМИ игроками.
    // Союзников обходить не нужно — они не мешают захвату и могут идти рядом.
    // Данные о командах берём из json.belowHtml, который обновляется на каждом шаге.
    const getBlockedIds = (json) => {
        if (!json?.players || !json?.belowHtml) return new Set();

        const playerTeams = parsePlayerTeams(json.belowHtml);
        const blocked = new Set();

        for (const roomData of Object.values(json.players)) {
            const names = extractPlayerNames(roomData.names);
            const hasEnemy = names.some(name => {
                const team = playerTeams.get(name);
                return team !== undefined && team !== myTeam;
            });

            if (hasEnemy) {
                blocked.add(Number(roomData.room));
            }
        }

        return blocked;
    };

    // shouldAbort: после каждого шага проверяем актуальное состояние баз из json.belowHtml.
    // Если целевая база уже захвачена нашей командой — незачем продолжать движение к ней.
    const shouldAbort = (json) => {
        if (!json?.belowHtml) return false;

        const currentBases = parseTaktBasesFromHtml(baseNames, json.belowHtml);
        const targetBase = currentBases.find(b => b.id === target.id);

        if (targetBase?.team === myTeam) {
            CommonHelper.log('Авто-такт: база "' + target.name + '" захвачена нашей командой, меняем цель');
            return true;
        }

        return false;
    };

    // toPoint идёт к точке и в конце навигирует через json.realUrl → страница перезагружается.
    const result = await t.toPoint(target.id, {
        delay,
        eachCallback: renderGrid,
        getBlockedIds,
        shouldAbort,
    });

    if (result === 'aborted') {
        // Перезагружаем страницу, чтобы получить свежее состояние баз и выбрать новую цель
        CommonHelper.reloadPage();
    }
}
