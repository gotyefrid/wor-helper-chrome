(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    let chemistryStatus = await CommonHelper.getExtStorage('wor_mining_active') ?? false;
    let buttonAction = await CommonHelper.getExtStorage('wor_mining_opt_active_button');

    if (chemistryStatus) {
        if (buttonAction) {
            CommonHelper.createDisableButton('Отключить рудокопа', async () => {
                CommonHelper.turnMining(false);
                CommonHelper.turnFighting(false);
                await CommonHelper.reloadPage();
            });
        }

        CommonHelper.log('Мы на одной из страниц рудокопа!');
        // Настройка алхимика
        let mining = new Mining();

        if (mining.isMiningPage) {
            if (mining.isBuyMiningPassPage) {
                await mining.processBuyPassPage();
                return;
            }

            if (mining.isStartPage) {
                await mining.processStartPage();
                return;
            }

            if (mining.isMainPage || mining.isGamePage) {
                await mining.processMainAndGamePages();
                return;
            }

            if (mining.isGetLootPage) {
                await CommonHelper.setFightExitUrl(document.location.href);
                await CommonHelper.delay(CommonHelper.SMALL_RANDOM);
                await mining.processGetLootPage();
                return;
            }

            if (mining.isWaitingPage) {
                let exitUrl = location.origin + '/wap/' + mining.extractKopatLink(document);
                CommonHelper.setFightExitUrl(exitUrl);
                document.querySelector('#progressBar')?.insertAdjacentHTML('afterend', '<a href="' + exitUrl + '">Обновить</a>')
                await mining.processWaitPage();
                return;
            }

            CommonHelper.setFightExitUrl('');
            let inspectButton = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Шахта'));

            if (mining.isTerritoryPage && inspectButton) {
                await CommonHelper.setFightExitUrl(inspectButton.href);
                await CommonHelper.delay(CommonHelper.SMALL_MID_RANDOM);
                await mining.processTerritoryPage(inspectButton);
                return;
            } else {
                CommonHelper.sendTelegramMessage('На странице почему то нету кнопки прохода в шахту. Ничего не делаем.');
            }
        } else {
            CommonHelper.log('Процессинг рудокопа запущен не на странице доступной для рудокопства. Ничего не делаем');
        }
    } else {
        if (buttonAction) {
            CommonHelper.createDisableButton('Включить рудокопа', () => {
                CommonHelper.turnMining(true);
                CommonHelper.turnFighting(true);
                CommonHelper.reloadPage();
            });
        }
    }
})();