(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }
    
    let fishingStatus = await CommonHelper.getExtStorage('wor_fishing_active') ?? false;

    if (fishingStatus) {
        CommonHelper.createDisableButton('Отключить рыбалку', async () => {
            await CommonHelper.turnFishing(false);
            await CommonHelper.turnFighting(false);
            await CommonHelper.reloadPage();
        });

        // Настройка рыбалки
        let fishing = new Fishing();

        if (fishing.isTerritoryPage) {
            await fishing.processTerritoryPage();
            return;
        }

        if (fishing.isGamePage || fishing.isMainPage) {
            await fishing.processMainAndGamePages();
            return;
        }

        // Показать сколько времени нужно ждать всего
        fishing.showTimeRequired();

        if (fishing.isFishingPage) {
            if (fishing.isWaitingFishPage) {
                CommonHelper.setFightExitUrl(document.location.href);
                fishing.processWaitingFishPage();
                return;
            }

            if (fishing.isSetLocationPage){
                await CommonHelper.delay(CommonHelper.getRandomNumber(1000, 1500));
                CommonHelper.setFightExitUrl(document.location.href);
                fishing.processSetLocationPage();
                return;
            }
        }
    } else {
        CommonHelper.createDisableButton('Включить рыбалку', async () => {
            await CommonHelper.turnFishing(true);
            await CommonHelper.turnFighting(true);
            await CommonHelper.reloadPage();
        });
    }
})();