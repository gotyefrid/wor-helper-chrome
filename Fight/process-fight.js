(async function () {
    ({ wor_fight_active: fightStatus } = await chrome.storage.local.get(["wor_fight_active"]));
    // Настройка сражения
    let fight = new Fight();
    fight.potOrder();

    if (fightStatus) {
        CommonHelper.createDisableButton('Отключить сражение', () => {
            CommonHelper.turnFighting(false);
            CommonHelper.reloadPage();
        });

        await CommonHelper.log('Мы на странице боя!');

        let skipList = await CommonHelper.getExtStorage('wor_fight_not_to_fight');
        skipList = skipList.map(name => name.toLowerCase().trim());

        // Пропускать боссов
        fight.enemiesToSkip = skipList;

        fight.needPotHP = await CommonHelper.getExtStorage('wor_fight_pot_hp_active');
        fight.needPotMP = await CommonHelper.getExtStorage('wor_fight_pot_mp_active');

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



