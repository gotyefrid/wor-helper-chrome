(async function () {
    ({ wor_fight_active: fightStatus } = await chrome.storage.local.get(["wor_fight_active"]));

    if (fightStatus) {
        // CommonHelper.createDisableButton('Отключить сражение', () => {
        //     CommonHelper.turnFighting(false);
        //     CommonHelper.reloadPage();
        // });

        await CommonHelper.log('Мы на странице боя!');

        // Настройка сражения
        let fight = new Fight();
        // Пропускать боссов
        fight.enemiesToSkip = Fight.BOSS_NAMES.concat([
        ]);

        fight.needPotHP = await CommonHelper.getExtStorage('wor_fight_pot_hp_active');
        fight.needPotHP = await CommonHelper.getExtStorage('wor_fight_pot_mp_active');

        fight.levelToSkip = (() => {
            let storedValue = CommonHelper.getLocalStorage('wor_fight_level_to_skip');
            let parsedValue = parseInt(storedValue, 10);

            return Number.isInteger(parsedValue) ? parsedValue : null;
        })()

        // Действие если моб из стоп листа
        fight.enemiesSkipListCallback = async function (enemyName, _enemyLevel, fightClass) {
            let nothingToDoList = Fight.BOSS_NAMES.map(name => name.toLowerCase());

            if (nothingToDoList.some(name => enemyName.toLowerCase().includes(name))) {
                CommonHelper.log('Бой с боссом, бьём руками.');
                await CommonHelper.delay(3000);
                CommonHelper.reloadPage();
                return;
            }

            await fightClass.processEnemyNotAllowed(enemyName);
        };

        // Ссылка выхода из файта
        let exitUrl = await CommonHelper.getExtStorage('wor_fight_exit_url') || null;

        // Сдаваться?
        let giveUp = (await CommonHelper.getExtStorage("wor_fight_give_up_active")) ?? false;

        // Обработчик файта
        fight.processFightDefault(giveUp, exitUrl);
    } else {
        // CommonHelper.createDisableButton('Включить сражение', () => {
        //     CommonHelper.turnFighting(true);
        //     CommonHelper.reloadPage();
        // });
    }
})();



