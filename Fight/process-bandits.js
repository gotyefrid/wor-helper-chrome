(async function () {
    ({ wor_bandits_active: fightStatus } = await chrome.storage.local.get(["wor_bandits_active"]));

    if (fightStatus) {
        // CommonHelper.createDisableButton('Отключить разбойников', () => {
        //     CommonHelper.turnBandits(false);
        //     CommonHelper.reloadPage();
        // });

        await CommonHelper.log('Мы на странице боя c разбойником!');

        // Настройка сражения
        let fight = new Fight();

        // Пропускать боссов
        fight.enemiesToSkip = Fight.BOSS_NAMES.concat([
            // Сюда можно дописать нужных мобов для пропуска
        ]);

        fight.needPotHP = await CommonHelper.getExtStorage('wor_fight_pot_hp_active');
        fight.needPotMP = await CommonHelper.getExtStorage('wor_fight_pot_mp_active');

        // Действие если моб из стоп листа
        fight.enemiesSkipListCallback = async function (enemyName, _enemyLevel, fightClass) {
            let nothingToDoList = Fight.BOSS_NAMES.map(name => name.toLowerCase());

            if (nothingToDoList.some(name => enemyName.toLowerCase().includes(name))) {
                CommonHelper.log('Бой с боссом, бьём руками.');
                return;
            }
        };

        await process(fight);
    } else {
        // CommonHelper.createDisableButton('Включить разбойников', () => {
        //     CommonHelper.turnBandits(true);
        //     CommonHelper.reloadPage();
        // });
    }
})();

async function process(fightClass) {
    if (!fightClass.isFightPage) {
        await CommonHelper.delay(CommonHelper.SMALL_RANDOM);
        await CommonHelper.log('Процессинг боя запущен на на странице боя. Обновляем страницу!');
        CommonHelper.reloadPage();
        return;
    }

    if (fightClass.isWaitPage) {
        CommonHelper.log('Мы на странице ожидания, обновляемся...');
        await fightClass.processWaitPage(CommonHelper.SMALL_MID_RANDOM);
        return;
    }

    if (fightClass.isExitPage) {
        // Ссылка выхода из файта
        let exitUrl = 'http://185.212.47.8/wap/gorod.php?uni=1742499244&hash=a25fdb6';
        CommonHelper.log('Мы на странице выхода из боя!');
        await fightClass.exitFromFight(exitUrl, null, CommonHelper.getRandomNumber(1000, 2000));
        return;
    }

    let enemyName = fightClass.getEnemyName();

    if (enemyName) {
        if (!enemyName.includes('Разбо')) {
            CommonHelper.sendTelegramMessage('Противник не разбойник, что-то не так...');
            return;
        }
    } else {
        await CommonHelper.log('Имя противника не найдено, значит ниче не делаем');
        return;
    }

    // Если мы тут - значит мы на странице боя
    await CommonHelper.log('Атакуем');
    await CommonHelper.delay(CommonHelper.EXTRA_SMALL_RANDOM);

    if (fightClass.needPotHP) {
        await fightClass.potHP();
    }

    if (fightClass.needPotMP) {
        await fightClass.potMP();
    }

    let hitButton = document.querySelector('input[name=bitvraga]');

    if (hitButton) {
        await CommonHelper.clickAndWait(hitButton);
    } else {
        CommonHelper.sendTelegramMessage('Нет кнопки ударить врага.')
    }
}

