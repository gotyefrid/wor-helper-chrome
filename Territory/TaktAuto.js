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
    await runAutoTakt(t, bases, myTeam, delay);
}

function parseTaktBases(baseNames, container) {
    const html = container.innerHTML;
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

async function runAutoTakt(t, bases, myTeam, delay) {
    // Цели: базы не под контролем нашей команды (нейтральные или вражеские)
    const targets = bases.filter(b => b.team !== myTeam);

    if (targets.length === 0) {
        CommonHelper.log('Авто-такт: все базы захвачены командой №' + myTeam + ', ждём...');
        await CommonHelper.delay(1000, 2000);
        CommonHelper.reloadPage();
        return;
    }

    // Случайный выбор цели из доступных
    const target = targets[Math.floor(Math.random() * targets.length)];
    CommonHelper.log('Авто-такт: идём к базе "' + target.name + '" (команда: ' + (target.team ?? 'нейтральная') + ')');

    const renderGrid = (json) => CommonHelper.renderMiniGridInto(
        document.getElementById('gridA'), json.grid || []
    );

    // toPoint идёт к точке и в конце навигирует через json.realUrl → страница перезагружается.
    // getBlockedIds вызывается после каждого шага: если другой игрок встал на маршрут,
    // путь автоматически перестраивается в обход занятых клеток.
    await t.toPoint(target.id, delay, renderGrid, null, {
        getBlockedIds: (json) => Territory.extractOccupiedRooms(json?.players),
    });
}
