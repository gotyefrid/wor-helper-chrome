(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    let fishingStatus = await CommonHelper.getExtStorage('wor_fishing_active') ?? false;
    let buttonAction = await CommonHelper.getExtStorage('wor_fishing_opt_active_button');

    if (fishingStatus) {
        if (buttonAction) {
            CommonHelper.createDisableButton('Отключить рыбалку', async () => {
                await CommonHelper.turnFishing(false);
                await CommonHelper.turnFighting(false);
                await CommonHelper.reloadPage();
            });
        }

        // Настройка рыбалки
        let fishing = new Fishing();

        if (fishing.isFishingPage) {
            if (fishing.isTerritoryPage) {
                await fishing.processTerritoryPage();
                return;
            }

            if (fishing.isGamePage || fishing.isMainPage) {
                await fishing.processMainAndGamePages();
                return;
            }

            if (fishing.isWaitingFishPage) {
                CommonHelper.log('Мы на странице ожидания поклёвки');
                CommonHelper.setFightExitUrl(document.location.href);

                // Cколько времени нужно ждать всего
                let time = fishing.getTimeRequired();

                if (time !== null) {
                    showTimeRequired(time);

                    if (time == 0) {
                        (async () => {
                            CommonHelper.log('Баг 0 секунд, перезагрузим страницу через 4 секунды.');
                            await CommonHelper.delay(4000);
                            CommonHelper.reloadPage();
                        })();
                    }
                }

                fishing.processWaitingFishPage();
                return;
            }

            if (fishing.isSetLocationPage) {
                CommonHelper.log('Мы на странице выбора локации рыбалки');
                await CommonHelper.delay(CommonHelper.SMALL_MID_RANDOM);
                CommonHelper.setFightExitUrl(document.location.href);
                fishing.processSetLocationPage();
                return;
            }
        }
    } else {
        if (buttonAction) {
            CommonHelper.createDisableButton('Включить рыбалку', async () => {
                await CommonHelper.turnFishing(true);
                await CommonHelper.turnFighting(true);
                await CommonHelper.reloadPage();
            });
        }
    }
})();

function showTimeRequired(value) {
    // Находим <span> с id="mf"
    const mfElement = document.getElementById("mf");

    if (mfElement) {
        // Создаем новый <span> и вставляем после #mf (без лишних операций)
        mfElement.insertAdjacentHTML("afterend", `<span> из ${value}</span>`);
    }
}