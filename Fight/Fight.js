class Fight {
    isFightPage = false;
    isExitPage = false;
    isWaitPage = false;
    isAttackPage = false;
    beforeProcessCallback = null;
    enemiesToSkip = [];
    enemiesSkipListCallback = null;
    levelToSkip = null;
    levelSkipCallback = null;
    needPotHP = false;
    needPotMP = false;
    potHPThreshold = 50;
    potMPThreshold = 50;
    attackType = 2; // 1 = физический, 2 = магический

    static BOSS_NAMES = Object.freeze([
        'Единорог',
        'Голем',
        'Тигр',
        'Крокодил',
        'Зеленый дракон',
        'Рыцарь смерти',
        'Орк',
        'Красный дракон',
        'Кристальный дракон',
        'Песчаный червь',
        'Минотавр',
        'Цербер',
        'Страж руин',
    ]);

    constructor() {
        this.#checkCurrentPage();
    }

    #checkCurrentPage() {
        const fightPaths = ["/wap/boj", "/wap/wait", "/wap/logfull"];

        // Определяем, является ли текущая страница страницей боя
        this.isFightPage = fightPaths.some(path => window.location.pathname.includes(path)) ||
            document.querySelector('input[name="bitvraga"]') !== null;

        if (this.isFightPage) {
            this.isAttackPage = window.location.href.includes('boj');

            // Проверяем наличие ссылки "Выход из боя"
            this.isExitPage = !!([...document.querySelectorAll('a')].find(text => text.textContent.includes('Выход из боя')));

            // Проверяем, является ли страница страницей ожидания
            this.isWaitPage = window.location.href.includes('wait');
        }
    }

    async processFightDefault(giveUp = false, exitUrl = null, beforeExitCallback = null) {
        if (!this.isFightPage) {
            await CommonHelper.log('Процессинг боя запущен на на странице боя. Ничего не делаем');
            return;
        }

        if (typeof this.beforeProcessCallback === "function") {
            await CommonHelper.log('Делаем указанную логику перед началом процессинга боя');
            await this.beforeProcessCallback();
        }

        if (this.isWaitPage) {
            CommonHelper.log('Мы на странице ожидания, обновляемся...');
            await this.processWaitPage(CommonHelper.getRandomNumber(300, 800));
            return;
        }

        if (this.isExitPage) {
            CommonHelper.log('Мы на странице выхода из боя!');
            await this.exitFromFight(exitUrl, beforeExitCallback, CommonHelper.getRandomNumber(300, 800));
            return;
        }

        let isPlayerInitiatedBattle = await this.isPlayerInitiatedBattle();

        if (isPlayerInitiatedBattle) {
            await CommonHelper.log('В этот бой игрок вмешался сам, бот ничего не должен делать. Жду 5сек.');
            await CommonHelper.delay(5000);
            await CommonHelper.reloadPage();
            return;
        } else {
            await CommonHelper.log('Обычный бой, без вмешательства');
        }

        if (giveUp) {
            this.handleGiveUp();
            return;
        }

        let enemyName = this.getEnemyName();

        if (enemyName) {
            let skip = false;
            const threshold = Number(await CommonHelper.getExtStorage('wor_fight_low_damage_threshold')) || 0;
            let isLowDamage = threshold > 0 && await this.isLowDamage(threshold);

            if (isLowDamage) {
                let message = 'Я бью меньше ' + threshold + ', что-то тут не так, ничего не делаю больше';
                CommonHelper.log(message);
                CommonHelper.sendTelegramMessage(message);
                await CommonHelper.delay(10000);
                await CommonHelper.reloadPage();
                return;
            }

            await this.trackEnemyDodges(5, async () => {
                let message = 'Слишком много уворотов, что-то тут не так, ничего не делаю больше';
                CommonHelper.log(message);
                CommonHelper.sendTelegramMessage(message);
                await CommonHelper.delay(10000);
                await CommonHelper.reloadPage();
                return;
            });

            let checkTrauma = await CommonHelper.getExtStorage('wor_fight_check_trauma');
            let maxTraumaInHours = await CommonHelper.getExtStorage('wor_fight_max_trauma');
            maxTraumaInHours = Number(maxTraumaInHours) || 0;

            if (checkTrauma && CommonHelper.getTraumaTime(true) > (maxTraumaInHours * 60)) {
                CommonHelper.log('Много травмы, ничего не делаю в бою');
                CommonHelper.sendTelegramMessage('Много травмы, ничего не делаю в бою');
                skip = true;
            }

            let onlyMobs = await CommonHelper.getExtStorage('wor_fight_only_mobs');
            if (onlyMobs === undefined) onlyMobs = true;

            if (onlyMobs) {
                let isMonster = this.isMonster();
                if (!isMonster) {
                    CommonHelper.log('Против меня зашёл в бой игрок ' + enemyName);
                    CommonHelper.sendTelegramMessage('Против меня зашёл в бой игрок ' + enemyName);
                    skip = true;
                }
            }

            let enemyLevel = parseInt(enemyName.match(/\d+/)[0], 10);

            if (this.enemiesToSkip) {
                if (this.enemiesSkipListHas(enemyName)) {
                    if (typeof this.enemiesSkipListCallback === "function") {
                        CommonHelper.log('Выполняем кастомную фукнцию скипа противника');
                        await this.enemiesSkipListCallback(enemyName, enemyLevel, this);
                        return;
                    }

                    CommonHelper.sendTelegramMessage('Бой с запрещённым мобом ' + enemyName, 'common', true, 'html', 120);
                    CommonHelper.log('Бой с запрещённым мобом ' + enemyName);
                    await CommonHelper.delay(10000);
                    CommonHelper.reloadPage();
                    return;
                }
            }

            this.levelToSkip = await (async function () {
                let lvl = await CommonHelper.getExtStorage('wor_fight_level_to_skip');
                return lvl ? parseInt(lvl, 10) : null;
            })();

            if (this.levelToSkip && enemyLevel >= this.levelToSkip && skip === false) {
                if (typeof this.levelSkipCallback === "function") {
                    CommonHelper.log('Выполняем фукнцию скипа противника по уровню');
                    await this.levelSkipCallback(enemyName, enemyLevel, this);
                    return;
                }

                CommonHelper.sendTelegramMessage('Скип боя, так как противник больше ' + this.levelToSkip + ' уровня');
                await CommonHelper.delay(15000);
                await CommonHelper.reloadPage();
                return;
            }

            if (skip) {
                CommonHelper.log('Скип');
                await CommonHelper.delay(15000);
                await CommonHelper.reloadPage();
                return;
            }
        } else {
            await CommonHelper.log('Имя противника не найдено, ничего не делаем.');
            await CommonHelper.sendTelegramMessage('Имя противника не найдено, ничего не делаем.');
            await CommonHelper.delay(15000);
            return;
        }

        // Если мы тут - значит мы на странице боя
        await CommonHelper.log('Атакуем');

        if (this.needPotHP) await this.potHP(this.potHPThreshold);
        if (this.needPotMP) await this.potMP(this.potMPThreshold);

        // Устанавливаем тип удара (1 = физический, 2 = магический)
        const udtypeEl = document.querySelector('#udartype');
        const toggleUdtypeEl = document.querySelector('#toggle-udartype');
        if (udtypeEl) udtypeEl.value = this.attackType;
        if (toggleUdtypeEl) toggleUdtypeEl.checked = (String(this.attackType) === '2');

        let hitButton = document.querySelector('input[name=bitvraga]');

        await CommonHelper.delay(CommonHelper.SMALL_RANDOM);

        if (hitButton) {
            await CommonHelper.clickAndWait(hitButton);
        } else {
            await CommonHelper.sendTelegramMessage('Нет кнопки ударить врага.')
        }
    }

    isMonster() {
        return document.querySelector('img[src*=monster]') !== null;
    }

    async isPlayerInitiatedBattle() {
        const CACHE_PERIOD = 20 * 1000;                         // 20 с
        const CACHE_KEY = 'wor_fight_player_initiated_battle';

        try {
            const now = Date.now();
            const cache = await CommonHelper.getExtStorage(CACHE_KEY);

            // --- 1. если проверяли < 20 с назад – берём кэш -----------------------
            if (cache && cache.lastCheck && now - cache.lastCheck < CACHE_PERIOD) {
                await CommonHelper.log('Берём «вмешательство» из кэша');
                return !!cache.intervened;
            }

            await CommonHelper.log('Проверяем «вмешательство» по чату');

            // --- 2. грузим HTML чата ---------------------------------------------
            const chatUrl = document.querySelector('a[href*=chat2]')?.href;
            if (!chatUrl) {
                CommonHelper.log('Нет ссылки на чат');
                return false;
            }

            const html = await (await fetch(chatUrl)).text();
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const msgBox = doc.querySelector('#msg_box');
            // getParsedMessagesNew возвращает сообщения от новых к старым (как и старый парсер)
            const messages = Chat.getParsedMessagesNew(msgBox);

            // --- 3. ищем первое релевантное system-сообщение ----------------------
            const endedRe = /Бой №\d+\s+закончен/i;
            let intervened = false;

            for (const msg of messages) {
                // type в верхнем регистре: 'SYSTEM', 'PUBLIC', 'PUBLIC_TO', 'PRIVATE'
                if (msg.type !== 'SYSTEM') continue;

                if (endedRe.test(msg.text)) {       // бой закончился
                    intervened = false;
                    break;
                }

                if (msg.text.includes('Вы вмешались в бой!')) {
                    intervened = true;                // бой ещё идёт
                    break;
                }
            }

            // --- 4. сохраняем кэш -------------------------------------------------
            await CommonHelper.setExtStorage(CACHE_KEY, {
                lastCheck: now,
                intervened,
            });

            return intervened;

        } catch (err) {
            CommonHelper.log('Ошибка при получении сообщений чата: ' +
                JSON.stringify(err));
            return false;
        }
    }


    async handleGiveUp() {
        CommonHelper.log('Сдаёмся!');
        await CommonHelper.delay(CommonHelper.SMALL_MID_RANDOM);
        let giveUpButton = document.querySelector('a[href*=killme]');

        if (giveUpButton) {
            // Переходим по href напрямую, минуя onclick confirm()
            document.location = giveUpButton.href;
            return;
        }

        CommonHelper.log('Не нашлась кнопка Сдаться, ничего не делаем.');
        await CommonHelper.sendTelegramMessage('Не нашлась кнопка Сдаться, ничего не делаем.');

        await CommonHelper.delay(30000);
        await CommonHelper.reloadPage();
    }

    /**
     * Проверяет, наносит ли игрок урон меньше заданного порога,
     * игнорируя добивающие удары (когда у цели после удара [0/...]).
     *
     * @param {number} threshold - Пороговое значение урона.
     * @returns {Promise<boolean>}
     */
    async isLowDamage(threshold = 0) {
        // найдём блок логов
        const logText = [...document.querySelectorAll('.table_menu')]
            ?.find(ta => ta.innerText.includes('Игрок'))
            ?.innerText;

        if (!logText) {
            CommonHelper.log('Не нашли историю ударов');
            return false;
        }

        const playerName = await CommonHelper.getExtStorage('wor_chat_player_name');

        // убираем [число] после имени (ваш хак) и берём последние строки с нашим игроком
        const cleanText = logText.replace(/\[\d+\]/g, '[]');
        const lastLines = cleanText
            .split('\n')
            .filter(line => line.includes(`Игрок ${playerName}[]`));

        if (lastLines.length === 0) return false;

        // чаще всего нужная — самая последняя запись:
        const lastLine = lastLines[0];

        // Регэксп:
        //  - Игрок <name>[] нанёс/нанес
        //  - опционально "критический", "магический"
        //  - "удар <число>"
        //  - потом что угодно (например "в голову", "игроку ...", "и пробил блок!")
        //  - квадратные скобки с HP вида [текущий/макс]
        const regex = new RegExp(
            `Игрок ${playerName}\\[\\] нан(?:е|ё)с(?: критический)?(?: магический)? удар (-?\\d+)[\\s\\S]*?\\[(\\d+)\\/(\\d+)\\]`,
            'g'
        );

        let match;
        while ((match = regex.exec(lastLine)) !== null) {
            const damage = Math.abs(parseInt(match[1], 10));
            const currentHp = parseInt(match[2], 10); // текущее HP цели после удара

            // Если цель добита (0 HP) — игнорируем такой удар
            if (currentHp === 0) continue;

            if (damage < threshold) {
                return true; // это действительно "малый" урон
            }
        }

        return false;
    }

    /**
     * Обновляет количество подряд уворотов противника.
     * Сброс при попадании, +1 при увороте.
     */
    async trackEnemyDodges(maxDodges = 5, callback = null) {
        const DODGE_STORAGE_KEY = 'wor_fight_dodge_streak';

        const logText = [...document.querySelectorAll('.table_menu')]
            ?.find(ta => ta.innerText.includes('Игрок'))
            ?.innerText;

        if (!logText) {
            CommonHelper.log('Не нашли боевой лог для чека уворотов');
            await CommonHelper.setExtStorage(DODGE_STORAGE_KEY, 0);
            return;
        }

        const playerName = await CommonHelper.getExtStorage('wor_chat_player_name');
        const cleanText = logText.replace(/\[\d+\]/g, '[]');
        const lastLines = cleanText.split('\n').filter(line => line.includes(`Игрок ${playerName}[]`));

        if (lastLines.length === 0) return;

        const lastLine = lastLines[0];

        // Проверка на уворот
        const isDodge = lastLine.includes(`Игрок`) && lastLine.includes(`пытался нанести удар`) && lastLine.includes('увернулся');

        if (isDodge) {
            // Получаем текущий счётчик
            let count = parseInt(await CommonHelper.getExtStorage(DODGE_STORAGE_KEY)) || 0;
            count += 1;

            await CommonHelper.setExtStorage(DODGE_STORAGE_KEY, count);
            CommonHelper.log(`Противник увернулся. Стрик: ${count}`);

            if (count > maxDodges) {
                if (typeof callback === "function") {
                    await CommonHelper.log('Делаем указанную логику при частых уворотах');
                    await callback();
                } else {
                    CommonHelper.log('Противник уклоняется слишком часто! Больше 5 раз подряд.');
                }
            }
        } else {
            // Если удар прошёл — сбросить счётчик
            await CommonHelper.setExtStorage(DODGE_STORAGE_KEY, 0);
            CommonHelper.log('Удар прошёл. Стрик уворотов сброшен.');
        }
    }

    // Unified potion consumption for HP and МА
    async consumePotion(selector, resourceLabel, threshold = 50) {
        try {
            const [current, max] = document
                .querySelector(selector)
                .innerText.split('/')
                .map(n => parseInt(n, 10));

            const percent = (current / max) * 100;
            await CommonHelper.log(`Текущее ${resourceLabel}: ${current}/${max} (${percent.toFixed(2)}%)`);

            if (percent > threshold) {
                await CommonHelper.log(`${resourceLabel} выше ${threshold}%, пить ничего не нужно.`);
                return;
            }

            // Приоритет от наименьшего к наибольшему — чтобы сначала расходовать мелкие банки
            const potionPriority = [
                `10 ${resourceLabel}`,
                `20 ${resourceLabel}`,
                `50 ${resourceLabel}`,
                `100 ${resourceLabel}`,
                `250 ${resourceLabel}`,
                `500 ${resourceLabel}`,
            ];

            await CommonHelper.log(`Ищем наименьшую доступную банку ${resourceLabel}`);

            // Ищем первую доступную банку из списка приоритета
            for (const potionName of potionPriority) {
                const potionElement = [...document.querySelectorAll('span.item-count')]
                    .find(span => span.innerText.trim() === potionName);

                if (potionElement) {
                    await CommonHelper.log(`Пьём банку ${potionName}`);
                    potionElement.parentElement.firstElementChild.click();
                    return; // выпили банку — выходим
                }

                await CommonHelper.log(`Не найдено зелье: ${potionName}`);
            }

            await CommonHelper.log(`Подходящих банок (${potionPriority.join(', ')}) не найдено. Ничего не пьём.`);
        } catch (error) {
            await CommonHelper.log(`Ошибка в consumePotion(${resourceLabel}): ${error}`);
        }
    }

    async potHP(threshold = 50) {
        await this.consumePotion('#hp_text', 'HP', threshold);
    }

    async potMP(threshold = 50) {
        await this.consumePotion('#mana_text', 'МА', threshold);
    }

    async processEnemyNotAllowed(enemyName) {
        let startHelpTime = CommonHelper.getLocalStorage('wor_fight_start_wait_help_time');
        startHelpTime = startHelpTime ? parseInt(startHelpTime) : null;

        if (startHelpTime) {
            const timeout = 30;
            let timePassed = CommonHelper.currentTime() - startHelpTime;

            if (timePassed <= timeout) {
                // TODO если помогли очень быстро, и следующий моб нападает тоже быстро -
                //  то wor_fight_start_wait_help_time не очищается и нужно ждать
                await CommonHelper.log('Прошло меньше ' + timeout + ' секунд в ожидании помощи. Ждем.');
                await CommonHelper.delay(5000);
                await CommonHelper.reloadPage();
            } else {
                await CommonHelper.log('Прошло больше ' + timeout + ' секунд в ожидании помощи. Бьём сами.');
                CommonHelper.deleteLocalStorage('wor_fight_start_wait_help_time');
            }
        } else {
            await CommonHelper.sendTelegramMessage('Напал моб из стоп листа ' + enemyName);
            await this.askToHelpSomeone();
            await CommonHelper.delay(5000);
            await CommonHelper.reloadPage();
        }
    }

    async askToHelpSomeone() {
        let fightNumber = this.getFightNumber();

        if (!fightNumber) {
            await CommonHelper.log('Не найден номер боя, чтобы попросить помощи.');
            await CommonHelper.sendMessageToChat('Не найден номер боя, чтобы попросить помощи.');
            return
        }

        let message = this.prepareHelpMessage(fightNumber);

        await CommonHelper.log('Просим о помощи');
        await CommonHelper.sendMessageToChat(message);
        CommonHelper.setLocalStorage('wor_fight_start_wait_help_time', CommonHelper.currentTime());
    }

    getFightNumber() {
        let toChatButton = document.querySelector('a[href*=tochat]');

        if (toChatButton) {
            return toChatButton ? new URLSearchParams(new URL(toChatButton).search).get("text") : '';
        }

        let title = document.querySelector('div.menu')?.innerText.toLowerCase();

        if (title.includes('бой') || title.includes('боя')) {
            const match = title.match(/№(\d+)/);
            const battleNumber = match ? match[1] : null;
            return battleNumber;
        }

        return '';
    }

    getEnemyName() {
        let enemyDiv = document.querySelector('form').nextElementSibling;

        if (!enemyDiv) {
            CommonHelper.log('Имя противника не найдено. Не найден enemyDiv.');
            return null;
        }

        let name = [...enemyDiv.querySelectorAll('span')].find(span => span.innerText.includes('['));

        if (name) {
            return name.innerText.trim();
        }

        CommonHelper.log('Имя противника не найдено. Не найден name.');

        return null;
    }

    enemiesSkipListHas(enemyName) {
        return this.enemiesToSkip.some(mob => enemyName.toLowerCase().includes(mob.toLowerCase()));
    }

    async processWaitPage(delay = CommonHelper.MEDIUM_RANDOM) {
        await CommonHelper.delay(delay);
        await CommonHelper.reloadPage();
    }

    async exitFromFight(exitUrl = null, beforeExitCallback = null, delay = CommonHelper.MEDIUM_RANDOM) {
        if (typeof beforeExitCallback === "function") {
            await CommonHelper.log('Делаем указанную логику перед выходом из боя');
            await beforeExitCallback();
        }

        await CommonHelper.log('Выходим из боя');
        await CommonHelper.delay(delay);

        if (exitUrl) {
            await CommonHelper.log('Переходим по переданной ссылке выхода');
            await CommonHelper.log(exitUrl);
            document.location = exitUrl;
            return;
        }

        await CommonHelper.log('Ссылка выхода не назначена. Переходим по ссылке /wap/teritory.php');
        document.location = '/wap/teritory.php';
    }

    prepareHelpMessage(fightNumber) {
        const messages = [
            '.flag.',
            '.flag2.',
            '.or.',
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        return `[log]${fightNumber}[/log] ${randomMessage}`;
    }

    //sortItemsByOrder(['10 МА', '20 МА', '100 МА', '250 МА', '500 МА']);
    sortItemsByOrder(order) {
        const slider = document.querySelector('.item-slider');
        const items = Array.from(slider.querySelectorAll('.item-image-wrapper'));

        // Создаём карту приоритетов
        const priorityMap = new Map(order.map((value, index) => [value, index]));

        // Сортируем элементы
        items.sort((a, b) => {
            const aValue = a.querySelector('.item-count')?.textContent.trim() || '';
            const bValue = b.querySelector('.item-count')?.textContent.trim() || '';

            const aPriority = priorityMap.has(aValue) ? priorityMap.get(aValue) : Infinity;
            const bPriority = priorityMap.has(bValue) ? priorityMap.get(bValue) : Infinity;

            return aPriority - bPriority;
        });

        // Удаляем все элементы и добавляем по-новому в отсортированном порядке
        items.forEach(item => slider.appendChild(item));
    }

    potOrder() {
        if (!this.isAttackPage) {
            return;
        }

        const slider = document.querySelector('.item-slider');
        const items = Array.from(slider.querySelectorAll('.item-image-wrapper'));

        // Просто в обратном порядке добавляем в родительский контейнер
        items.reverse().forEach(item => slider.appendChild(item));
    }
}
