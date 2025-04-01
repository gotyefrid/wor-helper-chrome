class Fight {
    isFightPage = false;
    isExitPage = false;
    isWaitPage = false;
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
            await this.processWaitPage();
            return;
        }

        if (this.isExitPage) {
            CommonHelper.log('Мы на странице выхода из боя!');
            await this.exitFromFight(exitUrl, beforeExitCallback);
            return;
        }

        let enemyName = this.getEnemyName();

        if (enemyName) {
            let skip = false;
            let isNullDamage = await this.isNullDamage();

            if (isNullDamage) {
                CommonHelper.sendTelegramMessage('Я бью 0, что-то тут не так, ничего не делаю больше');
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
                CommonHelper.sendTelegramMessage('Много травмы, ничего не делаю в бою');
                skip = true;
            }

            let isEnemyRealPlayer = CommonHelper.isRealPlayer(enemyName);

            if (isEnemyRealPlayer) {
                CommonHelper.sendTelegramMessage('Против меня зашёл в бой игрок ' + enemyName);
                skip = true;
            }

            let enemyLevel = parseInt(enemyName.match(/\d+/)[0], 10);

            let isEnemyNeedSkip = this.enemiesSkipListHas(enemyName);

            if (isEnemyNeedSkip && skip === false) {
                if (typeof this.enemiesSkipListCallback === "function") {
                    CommonHelper.log('Выполняем фукнцию скипа противника по списку запрещённых');
                    await this.enemiesSkipListCallback(enemyName, enemyLevel, this);
                    return;
                }
            }

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
        await CommonHelper.delay(CommonHelper.getRandomNumber(500, 2000));

        if (this.needPotHP) await this.potHP();

        if (this.needPotMP) await this.potMP();

        let hitButton = document.querySelector('input[name=bitvraga]');

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

    async potHP() {
        try {
            let HP = document.querySelector('#hp_text').innerText.split('/');
            let currentHP = parseInt(HP[0], 10);
            let maxHP = parseInt(HP[1], 10);
            let differ = maxHP - currentHP;

            if (differ > 0) {
                await CommonHelper.log('У меня не хватает ' + differ + ' HP');

                let potionName = "250 HP";

                // Явные проверки для каждой банки
                if (differ <= 15) {
                    potionName = "10 HP";
                } else if (differ <= 30) {
                    potionName = "20 HP";
                } else if (differ <= 70) {
                    potionName = "50 HP";
                } else if (differ <= 150) {
                    potionName = "100 HP";
                } else if (differ <= 250) {
                    potionName = "250 HP";
                } else if (differ <= 500) {
                    potionName = "500 HP";
                } else {
                    await CommonHelper.log(`Не нашли совпадений, пьём стандартную ${potionName} на всякий случай`);
                }

                await CommonHelper.log(`Будем использовать банку ${potionName}, так как differ = ${differ}`);

                if (potionName) {
                    await CommonHelper.log(`Пьём банку ${potionName}`);

                    let potionElement = [...document.querySelectorAll('span.item-count')]
                        .find(span => span.innerText.trim() === potionName);

                    if (potionElement) {
                        potionElement.parentElement.firstElementChild.click();
                    } else {
                        // await CommonHelper.sendTelegramMessage(`Не найдено зелье: ${potionName}`);
                        await CommonHelper.log(`Не найдено зелье: ${potionName}`);
                    }
                } else {
                    await CommonHelper.log("Нет подходящей банки для лечения.");
                }
            }
        } catch (error) { }
    }

    async potMP() {
        try {
            let HP = document.querySelector('#mana_text').innerText.split('/');
            let currentMP = parseInt(HP[0], 10);
            let maxMP = parseInt(HP[1], 10);
            let differ = maxMP - currentMP;

            if (differ > 0) {
                await CommonHelper.log('У меня не хватает ' + differ + ' MP');

                let potionName = "250 МА";

                // Явные проверки для каждой банки
                if (differ <= 15) {
                    potionName = "10 МА";
                } else if (differ <= 30) {
                    potionName = "20 МА";
                } else if (differ <= 70) {
                    potionName = "50 МА";
                } else if (differ <= 150) {
                    potionName = "100 МА";
                } else if (differ <= 250) {
                    potionName = "250 МА";
                } else if (differ <= 500) {
                    potionName = "500 МА";
                } else {
                    await CommonHelper.log(`Не нашли совпадений, пьём стандартную ${potionName} на всякий случай`);
                }

                await CommonHelper.log(`Будем использовать банку ${potionName}, так как differ = ${differ}`);

                if (potionName) {
                    await CommonHelper.log(`Пьём банку ${potionName}`);

                    let potionElement = [...document.querySelectorAll('span.item-count')]
                        .find(span => span.innerText.trim() === potionName);

                    if (potionElement) {
                        potionElement.parentElement.firstElementChild.click();
                    } else {
                        // await CommonHelper.sendTelegramMessage(`Не найдено зелье: ${potionName}`);
                        await CommonHelper.log(`Не найдено зелье: ${potionName}`);
                    }
                } else {
                    await CommonHelper.log("Нет подходящей банки для лечения.");
                }
            }
        } catch (error) { }
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
}
