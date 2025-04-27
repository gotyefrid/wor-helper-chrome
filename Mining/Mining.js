class Mining {
    isBuyMiningPassPage = false;
    isMiningPage = false;
    isWaitingPage = false;
    isGetLootPage = false;
    isMainPage = false;
    isGamePage = false;

    constructor() {
        this.#checkCurrentPage();
    }

    #checkCurrentPage() {
        const paths = [
            "/wap/kopat",
            "/wap/teritory",
            "/wap/main",
            "wap/game",
            "wap/shaxtap",
            "wap/shaxtal",
            "wap/shaxtar",
        ];

        // Определяем, является ли текущая страница страницей боя
        this.isMiningPage = paths.some(path => window.location.pathname.includes(path));

        if (this.isMiningPage) {
            this.isBuyMiningPassPage = [...document.querySelectorAll('div')].find(div => div.innerText.includes('Купить пропуск')) ? true : false;
            this.isStartPage = [...document.querySelectorAll('.button')].find(a => a.innerText.includes('Добывать ресурсы')) ? true : false;
            this.isWaitingPage = document.querySelector('#progressBar') ? true : false;
            this.isGetLootPage = [...document.querySelectorAll('a')].find(a => a.innerText.includes('Продолжить поиски')) ? true : false;
            this.isTerritoryPage = document.location.href.includes('teritory');
            this.isMainPage = document.location.href.includes('main');
            this.isGamePage = document.location.href.includes('game');
        }
    }

    async processStartPage() {
        let start = [...document.querySelectorAll('.button')].find(a => a.innerText.includes('Добывать ресурсы'));

        if (start) {
            console.log('нашил кнопу')
            await CommonHelper.clickAndWait(start);
            return;
        }
    }

    async processBuyPassPage() {
        let pass = [...document.querySelectorAll('.btninv')].find(div => div.innerText.includes('Купить за 120'));

        if (pass) {
            await CommonHelper.clickAndWait(pass);
            return;
        }
    }

    async processWaitPage() {
        CommonHelper.log('Ждем кнопки Собрать');
        CommonHelper.log('Паралельно ждём кнопки "В бой"', false);

        const progressBar = document.querySelector('#progressBar');

        if (!progressBar) {
            console.warn('Элемент progressBar не найден');
            return;
        }

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
        let getResourse = document.querySelector('img[src*=res]')

        if (getResourse) {
            await CommonHelper.clickAndWait(getResourse);
            return;
        }

        let continueButton = [...document.querySelectorAll('a')].find(a => a.innerText.includes('Продолжить поиски'));

        if (!continueButton) {
            await CommonHelper.sendTelegramMessage('Кнопка Продолжить поиски в шахте не найдена');
            return;
        }

        CommonHelper.log('Жмём кнопку "Продолжить поиски"');
        await CommonHelper.setFightExitUrl('');
        await CommonHelper.delay(CommonHelper.getRandomNumber(500, 1500));
        await CommonHelper.clickAndWait(continueButton);
    }

    async processTerritoryPage(inspectButton) {
        CommonHelper.log('Жмём переход в шахту');
        await CommonHelper.clickAndWait(inspectButton);
    }

    async processMainAndGamePages() {
        let shouldContinue = await CommonHelper.askWithTimeout('Рудокоп включен, продолжить скрипт?', 5000);

        if (!shouldContinue) return; // Если выбрали "Нет" — прерываем выполнение

        let exitUrl = await CommonHelper.getExtStorage('wor_fight_exit_url');

        if (exitUrl) {
            document.location = exitUrl;
            return;
        }

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

    /**
     * Возвращает ссылку из встроенного тега <script>, где вызывается
     * `location.replace('kopat.php…')`.
     *
     * Работает как в браузере (берёт скрипты из `document.scripts`),
     * так и с HTML-строкой (через `DOMParser` или Cheerio в Node.js).
     *
     * @param {Document|string} source – документ (window.document) либо сырой HTML.
     * @returns {string|null} — полный текст ссылки или null, если ничего не найдено.
    */
    extractKopatLink(source) {
        // 1. Получаем коллекцию <script>-тегов
        let scripts;

        if (typeof source === 'string') {
            // Вызов из Node-процесса / тестов: парсим строку
            const dom = new DOMParser().parseFromString(source, 'text/html');
            scripts = dom.scripts;
        } else if (source && source.scripts) {
            // Вызов из браузера: передали document
            scripts = source.scripts;
        } else {
            throw new Error('Передайте document или строку с HTML');
        }

        // 2. Регулярка ищет location.replace('kopat.php?…')
        const rx = /location\.replace\(['"]([^'"]*?kopat\.php[^'"]*)['"]\)/i;

        for (const { textContent } of scripts) {
            const m = rx.exec(textContent);
            if (m) return m[1];           // m[1] — сама ссылка
        }

        return null;                     // ничего не нашли
    }
}