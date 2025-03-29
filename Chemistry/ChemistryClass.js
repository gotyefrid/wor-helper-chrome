class Chemistry {
    isChemistryPage = false;
    isWaitingPage = false;
    isGetLootPage = false;
    isMainPage = false;
    isGamePage = false;

    constructor() {
        this.#checkCurrentPage();
    }

    #checkCurrentPage() {
        const paths = ["/wap/poisktrav", "/wap/teritory", "/wap/main", "wap/game"];

        // Определяем, является ли текущая страница страницей боя
        this.isChemistryPage = paths.some(path => window.location.pathname.includes(path));

        if (this.isChemistryPage) {
            this.isWaitingPage = document.querySelector('#progressBar') ? true : false;
            this.isGetLootPage = document.querySelector('input[value=Собрать]') ? true : false;
            this.isTerritoryPage = document.location.href.includes('teritory');
            this.isMainPage = document.location.href.includes('main');
            this.isGamePage = document.location.href.includes('game');
        }
    }

    async processWaitPage() {
        CommonHelper.log('Ждем кнопки Собрать');
        CommonHelper.log('Паралельно ждём кнопки "В бой"', false);

        // Ожидаем появления "В бой:"
        await CommonHelper.waitForElement('#msg_box', true, box => {
            let contur = box.querySelector('.contur');

            if (contur && contur.textContent.includes('В бой:')) {
                return true;
            } else {
                return false;
            }
        });
        await CommonHelper.reloadPage(); // Перезагружаем страницу, когда нашли "В бой:"
    }

    async processGetLootPage() {
        let getLootButton = document.querySelector('input[value=Собрать]');
        CommonHelper.log('Жмём кнопку "Собрать"');
        await CommonHelper.delay(CommonHelper.getRandomNumber(500, 1500));
        await CommonHelper.clickAndWait(getLootButton);
    }

    async processTerritoryPage(inspectButton) {
        CommonHelper.log('Жмём Осмотреться');
        await CommonHelper.clickAndWait(inspectButton);
    }

    async processMainAndGamePages() {
        let shouldContinue = await CommonHelper.askWithTimeout('Алхимик включен, продолжить скрипт?', 5000);

        if (!shouldContinue) return; // Если выбрали "Нет" — прерываем выполнение

        let toTerritoryButton = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Природа'));

        if (toTerritoryButton) {
            CommonHelper.log('Выходим на природу');
            await CommonHelper.clickAndWait(toTerritoryButton);
            return;
        }

        CommonHelper.sendTelegramMessage('На странице нету ссылки на природу, что-то тут не так:' + document.location.href);
        await CommonHelper.turnAlchemistry(false);
        await CommonHelper.turnFighting(false);
        return;
    }
}