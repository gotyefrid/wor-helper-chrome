(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }
    
    let chemistryStatus = await CommonHelper.getExtStorage('wor_chemistry_active') ?? false;

    if (chemistryStatus) {
        CommonHelper.createDisableButton('Отключить алхимию', async () => {
            CommonHelper.turnAlchemistry(false);
            CommonHelper.turnFighting(false);
            await CommonHelper.reloadPage();
        });

        CommonHelper.log('Мы на одной из страниц алхимии!');

        // Настройка алхимика
        let chemistry = new Chemistry();

        if (chemistry.isChemistryPage) {
            if (chemistry.isMainPage || chemistry.isGamePage) {
                await chemistry.processMainAndGamePages();
                return;
            }

            if (chemistry.isGetLootPage) {
                CommonHelper.setFightExitUrl(document.location.href);
                await chemistry.processGetLootPage();
                return;
            }

            if (chemistry.isWaitingPage) {
                CommonHelper.setFightExitUrl(document.location.href);
                await chemistry.processWaitPage();
                return;
            }

            CommonHelper.setFightExitUrl('');
            let inspectButton = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Осмотреться'));

            if (chemistry.isTerritoryPage && inspectButton) {
                await CommonHelper.setFightExitUrl(inspectButton.href);
                await CommonHelper.delay(CommonHelper.getRandomNumber(500, 1000));
                await chemistry.processTerritoryPage(inspectButton);
                return;
            } else {
                CommonHelper.sendTelegramMessage('На странице почему то нету кнопки Осмотреться. Ничего не делаем.');
            }
        } else {
            CommonHelper.log('Процессинг алхимии запущен на на странице доступной для алхимии. Ничего не делаем');
        }
    } else {
        CommonHelper.createDisableButton('Включить алхимию', () => {
            CommonHelper.turnAlchemistry(true);
            CommonHelper.turnFighting(true);
            CommonHelper.reloadPage();
        });
    }
})();