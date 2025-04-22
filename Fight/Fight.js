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

        let enemyName = this.getEnemyName();

        if (enemyName) {
            let skip = false;
            let isNullDamage = await this.isNullDamage();

            if (isNullDamage) {
                CommonHelper.log('Я бью 0, что-то тут не так, ничего не делаю больше');
                CommonHelper.sendTelegramMessage('Я бью 0, что-то тут не так, ничего не делаю больше');
                // CommonHelper.sendMessageToChat('?');
                // CommonHelper.turnAlchemistry(false);
                // CommonHelper.turnFighting(false);
                // CommonHelper.setFightExitUrl('');
                // CommonHelper.log('Нажимаю Сдаться и в город');
                // let exit = [...document.querySelectorAll('a')].find(a => a.innerText.includes('Сдаться и в город'));

                // if (exit) {
                //     CommonHelper.clickAndWait(exit);
                // } else {
                //     CommonHelper.sendTelegramMessage('Нет кнопки Сдаться и в город, просто больше ничего не делаем');
                // }

                return;
            }

            let checkTrauma = await CommonHelper.getExtStorage('wor_fight_check_trauma');
            let maxTrauma = await CommonHelper.getExtStorage('wor_fight_max_trauma');

            if (checkTrauma && CommonHelper.isTraumaMoreOrEqual(maxTrauma)) {
                CommonHelper.log('Много травмы, ничего не делаю в бою');
                CommonHelper.sendTelegramMessage('Много травмы, ничего не делаю в бою');
                skip = true;
            }

            let isEnemyRealPlayer = CommonHelper.isRealPlayer(enemyName);

            if (isEnemyRealPlayer) {
                CommonHelper.log('Против меня зашёл в бой игрок ' + enemyName);
                CommonHelper.sendTelegramMessage('Против меня зашёл в бой игрок ' + enemyName);
                skip = true;
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

            if (giveUp) {
                this.handleGiveUp();
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
            await CommonHelper.delay(15000);
            return;
        }

        // Если мы тут - значит мы на странице боя
        await CommonHelper.log('Атакуем');

        if (this.needPotHP) await this.potHP();
        if (this.needPotMP) await this.potMP();

        let hitButton = document.querySelector('input[name=bitvraga]');

        await CommonHelper.delay(CommonHelper.getRandomNumber(400, 1000));

        if (hitButton) {
            await CommonHelper.clickAndWait(hitButton);
        } else {
            await CommonHelper.sendTelegramMessage('Нет кнопки ударить врага.')
        }
    }

    async handleGiveUp() {
        CommonHelper.log('Нажимаем кнопку Сдаться!');
        await CommonHelper.delay(1000);
        let giveUpButton = document.querySelector('a[href*=killme]');

        if (giveUpButton) {
            await CommonHelper.clickAndWait(giveUpButton);
        }

        await CommonHelper.log('Не нашлась кнопка Сдаться, буду бить');
        await CommonHelper.delay(1000);
        await CommonHelper.sendTelegramMessage('Не нашлась кнопка Сдаться, ничего не делаем.');
    }

    async isNullDamage() {
        let info = [...document.querySelectorAll('.table_menu')]?.find(ta => ta.innerText.includes('Игрок'))?.innerText;

        if (!info) {
            CommonHelper.log('Не нашли историю ударов');
            return false;
        }


        info = info.replace(/\[\d+\]/g, '[]');
        let playerName = await CommonHelper.getExtStorage('wor_chat_player_name');

        if (info.includes(`Игрок ${playerName}[] нанес критический магический удар 0`) || info.includes(`Игрок ${playerName}[] нанес магический удар 0`)) {
            return true;
        }

        return false;
    }

    // Unified potion consumption for HP and МА
    async consumePotion(selector, resourceLabel) {
        try {
            const [current, max] = document
                .querySelector(selector)
                .innerText.split('/')
                .map(n => parseInt(n, 10));

            const percent = (current / max) * 100;
            await CommonHelper.log(`Текущее ${resourceLabel}: ${current}/${max} (${percent.toFixed(2)}%)`);

            // Формируем список приоритетных банок в зависимости от процента ресурса
            let potionPriority = [];
            if (percent <= 10) {
                potionPriority = [`500 ${resourceLabel}`];
            } else if (percent <= 20) {
                potionPriority = [`250 ${resourceLabel}`];
            } else if (percent <= 30) {
                potionPriority = [`100 ${resourceLabel}`];
            } else if (percent <= 40) {
                potionPriority = [`50 ${resourceLabel}`];
            } else if (percent <= 50) {
                potionPriority = [`10 ${resourceLabel}`, `20 ${resourceLabel}`]; // пробуем 10, если нет — 20
            }

            if (potionPriority.length === 0) {
                await CommonHelper.log(`${resourceLabel} выше 50%, пить ничего не не нужно.`);
                return;
            }

            await CommonHelper.log(`Выбраны банки: ${potionPriority.join(', ')} в зависимости от ${resourceLabel}%`);

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

    async potHP() {
        await this.consumePotion('#hp_text', 'HP');
    }

    async potMP() {
        await this.consumePotion('#mana_text', 'МА');
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

    async processWaitPage(delay = CommonHelper.getRandomNumber(1000, 2000)) {
        await CommonHelper.delay(delay);
        await CommonHelper.reloadPage();
    }

    async exitFromFight(exitUrl = null, beforeExitCallback = null, delay = CommonHelper.getRandomNumber(1000, 2000)) {
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
