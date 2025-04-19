(async function () {
    ({ wor_fight_active: fightStatus } = await chrome.storage.local.get(["wor_fight_active"]));
    // Настройка сражения
    let fight = new Fight();

    if (fightStatus) {
        CommonHelper.createDisableButton('Отключить сражение', () => {
            CommonHelper.turnFighting(false);
            CommonHelper.reloadPage();
        });

        await CommonHelper.log('Мы на странице боя!');

        // Пропускать боссов
        fight.enemiesToSkip = Fight.BOSS_NAMES.concat([
        ]);

        fight.needPotHP = await CommonHelper.getExtStorage('wor_fight_pot_hp_active');
        fight.needPotMP = await CommonHelper.getExtStorage('wor_fight_pot_mp_active');

        // Действие если моб из стоп листа
        fight.enemiesSkipListCallback = async function (enemyName, _enemyLevel, fightClass) {
            let nothingToDoList = Fight.BOSS_NAMES.map(name => name.toLowerCase());

            if (nothingToDoList.some(name => enemyName.toLowerCase().includes(name))) {
                CommonHelper.sendTelegramMessage('Бой с боссом ' + enemyName, 'common', true, 'html', 120);
                // let fightNumber = fightClass.getFightNumber();

                // if (fightNumber) {
                //     // будет спамить сильно, нужно 
                //     let message = '[log]' + fightNumber + '[/log]';
                //     CommonHelper.sendMessageToChat(message)
                //     CommonHelper.log('Отправили в игровой чат сообщение:' + message);
                // }

                CommonHelper.log('Бой с боссом, бьём руками.');
                await CommonHelper.delay(10000);
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
        CommonHelper.createDisableButton('Включить сражение', () => {
            CommonHelper.turnFighting(true);
            CommonHelper.reloadPage();
        });
    }
})();



