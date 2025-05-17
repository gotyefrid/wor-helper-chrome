(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    let fightStatus = await CommonHelper.getExtStorage('wor_fight_active');
    // Настройка сражения
    let fight = new Fight();
    fight.potOrder();
    
    let buttonAction = await CommonHelper.getExtStorage('wor_fight_opt_active_button');

    if (fightStatus) {
        if (buttonAction) {
            CommonHelper.createDisableButton('Отключить сражение', () => {
                CommonHelper.turnFighting(false);
                CommonHelper.reloadPage();
            });
        }

        await CommonHelper.log('Мы на странице боя!');

        let skipList = await CommonHelper.getExtStorage('wor_fight_not_to_fight') ?? [];
        skipList = skipList.map(name => name.toLowerCase().trim());

        // Пропускать боссов
        fight.enemiesToSkip = skipList;

        fight.needPotHP = await CommonHelper.getExtStorage('wor_fight_pot_hp_active');
        fight.needPotMP = await CommonHelper.getExtStorage('wor_fight_pot_mp_active');

        // Ссылка выхода из файта
        let exitUrl = await CommonHelper.getFightExitUrl() || null;

        // Сдаваться?
        let giveUp = (await CommonHelper.getExtStorage("wor_fight_give_up_active")) ?? false;

        // Обработчик файта
        fight.processFightDefault(giveUp, exitUrl);
    } else {
        if (buttonAction) {
            CommonHelper.createDisableButton('Включить сражение', () => {
                CommonHelper.turnFighting(true);
                CommonHelper.reloadPage();
            });
        }
    }
})();



