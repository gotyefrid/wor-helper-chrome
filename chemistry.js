let alchemistryTimeout; // Глобальная переменная для хранения таймера

start();

async function start() {
    // Если мы в чате - нужно проверить пришли ли мы сюда за помощью с мобом
    if (document.location.href.includes('chat') && localStorage.getItem('getSomeHelp')) {
        await getSomeHelpFromChat(localStorage.getItem('getSomeHelp'));
        return;
    }

    const allow = [
        "/wap/poisktrav",
        "/wap/teritory",
        "/wap/boj",
        "/wap/wait",
        "/wap/logfull",
        "/wap/main",
        "/wap/game",
    ];

    if (!allow.some(path => document.location.href.includes(path))) {
        log("Алхимия на этой странице выключена", false);
        return;
    }

    alchemistry();
}

async function alchemistry() {
    const result = await chrome.storage.local.get(["wor_alchemistry_active"]);

    if (alchemistryTimeout) {
        clearTimeout(alchemistryTimeout);
    } // Очищаем предыдущий таймер перед запуском нового

    async function runAlchemistryLoop() {
        if (!result.wor_alchemistry_active) {
            log(`Бот алхимии отключен`, false);
            return;
        }

        await checkTravm();

        // Если мы в процессе ожидания кнопки Собрать
        let isWaitingPoiskPage = document.querySelector('#progressBar') ? true : false;

        if (isWaitingPoiskPage) {
            log('Запоминаем ссылку lastPoiskTravUrl', false);
            localStorage.setItem('lastPoiskTravUrl', document.location.href);
            await delay(1000);

            log('Проверяем личные сообщения...');
            await delay(1000);
            processLastPrivateMessage();


            log('Ждем кнопки Собрать');
            // Ожидаем появления "В бой:"
            await checkBattleExists(); // эта строчка будет делаться бесконечно пока не найдется бой, либо страница не откроется новая (когда таймер закончится)
            location.reload(); // Перезагружаем страницу, когда нашли "В бой:"
        }

        // собрать
        await processSobratButton();

        await startPoiskProcess();

        await processFigth();

        let isMainPage = document.location.href.includes('main.php');
        let isGamePage = document.location.href.includes('game.php');
        let goToPrirodaButton = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Природа'));

        if (isMainPage || isGamePage) {
            log('Алхимик включен, ждем 30 сек для перехода на природу');
            await delay(30000);

            if (goToPrirodaButton) {
                log('Выходим на природу');
                await delay(1000);
                goToPrirodaButton.click();
                return;
            }

            sendTelegramMessage('На странице нету ссылки на природу, что-то тут не так:' + document.location.href);
            await turnOffAlchemistry();
            return;
        }

        // Запускаем новый вызов функции через случайный интервал, но ТОЛЬКО после завершения всех действий
        let randomDelay = getRandomNumber(1000, 5000);
        alchemistryTimeout = setTimeout(runAlchemistryLoop, randomDelay);
    }

    // Первый вызов
    runAlchemistryLoop();
}

async function turnOffAlchemistry() {
    await chrome.storage.local.set({ ['wor_alchemistry_active']: false });
}

async function processFigth() {
    let udatitButton = document.querySelector('input[name=bitvraga]');
    let exitButton = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Выход из боя'));
    let isFightPage = udatitButton ? true : false;
    let isExitPage = exitButton ? true : false;
    let isWaitPage = document.location.href.includes('wait');
    let isFight = isFightPage || isExitPage || isWaitPage

    if (isFight) {
        if (isWaitPage) {
            await delay(getRandomNumber(500, 1000));
            location.reload();
            return;
        }

        if (isExitPage) {
            await exitFromFight();
            return;
        }

        let negativeMobs = [
            'Дарбутар [25]',
            'Абигор [26]',
        ];

        let isCurrentMobNegative = negativeMobs.some(mob => document.body.innerText.toLowerCase().includes(mob.toLocaleLowerCase()));

        if (isCurrentMobNegative) {
            let toChatButton = document.querySelector('a[href*=tochat]')
            let fightNumber = new URLSearchParams(new URL(toChatButton).search).get("text");
            sendTelegramMessage('Напал моб из стоп листа');
            await delay(getRandomNumber(1000, 2000));
            log('Записываем номер боя в сторадж', false);
            localStorage.setItem('getSomeHelp', fightNumber);
            log('Клик по "В чат"', false);
            toChatButton.click();
            return;
        }

        // Если мы тут - значит мы на странице боя
        log('Атакуем');

        try {
            let HP = document.querySelector('img[src*="ma.png"]').nextElementSibling.innerText.split('/');
            let currentHP = parseInt(HP[0], 10);
            let maxHP = parseInt(HP[1], 10);

            if (currentHP < maxHP) {
                log('Пьём банку ХП');
                document.querySelector('img[src*="pot5.png"]').click();
            }
        } catch (error) { }

        await delay(getRandomNumber(500, 2000));

        udatitButton.click();
        return;
    }
}

async function startPoiskProcess() {
    if (startPoisk = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Осмотреться'))) {
        log('Очищаем lastSobratUrl', false);
        localStorage.setItem('lastSobratUrl', '')
        log('Жмём Осмотреться');
        await delay(getRandomNumber(1000, 3000));
        startPoisk.click();
        return;
    }
}

async function processSobratButton() {
    if ((sobrat = document.querySelector('input[value=Собрать]'))) {
        log('Собираем');
        localStorage.setItem('lastSobratUrl', document.location.href)
        await delay(getRandomNumber(1000, 3000));
        sobrat.click();
        return;
    }
}
// Функция для ожидания появления текста "В бой:"
async function checkBattleExists() {
    return new Promise((resolve) => {
        const checkBattle = async () => {
            log('Ищем кнопку в бой', false);
            let chatBox = document.querySelector('#msg_box');
            let contur = chatBox ? chatBox.querySelector('.contur') : null;

            if (chatBox && contur && contur.textContent.includes('В бой:')) {
                resolve(); // Как только нашли, резолвим промис
            } else {
                setTimeout(checkBattle, 2000); // Повторяем проверку через 2 секунды
            }
        };

        checkBattle(); // Запускаем первую проверку
    });
}

async function checkTravm() {
    let travmaImg = document.querySelector('.chat').querySelector('img[src*="aid.gif"');

    if (travmaImg) {
        log('Нашли травму!');
        await delay(1000);
        let time = travmaImg.nextSibling.textContent.trim().split(':');
        let hour = paresInt(time[0]);

        if (hour >= 4) {
            log('Травма больше чем 4 часа, уходим');
            await delay(1000);
            await turnOffAlchemistry();
            sendTelegramMessage('Алхимия остановлена, у меня травма. Ушёл в город');
            [...document.querySelectorAll('a')].find(text => text.innerText.includes('Главное меню')).click();
            return;
        }
    }
}

async function exitFromFight() {
    log('Выходим из боя');

    let lastSobratUrl = localStorage.getItem('lastSobratUrl');

    if (lastSobratUrl) {
        log('Переходим по сохранённой ссылке для СБОРА lastSobratUrl');
        document.location = lastSobratUrl;
        return;
    }

    await delay(getRandomNumber(500, 2000));

    let lastPoiskTravUrl = localStorage.getItem('lastPoiskTravUrl');

    if (lastPoiskTravUrl) {
        log('Возвращаемся к поиску трав по сохранённой ранее ссылке lastPoiskTravUrl');
        document.location = lastPoiskTravUrl;
        return;
    }

    log('Переходим по ссылке /wap/teritory.php');
    document.location = lastPoiskTravUrl ? lastPoiskTravUrl : '/wap/teritory.php';
}

async function getSomeHelpFromChat(fightNumber) {
    let sendMessageButton = document.querySelector('input[value="Сказать всем"]');
    let messageInput = document.querySelector('#postmessage');

    const messages = [
        'хелп .flag2.',
        'помогите',
        'снесите плиз',
        'убейте пожалуйста',
        'плиз снесите',
        'помогите плиз',
        'нужна хелпа',
        'замочите моба плиз',
        'хелпатине с мобом',
        'снос',
        'аааааа хелп',
        '.flag.',
        'снос .2pistoleta.',
        '',
        '',
        '',
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    messageInput.value = `[log]${fightNumber}[/log] ${randomMessage}`;

    sendMessageButton.click();
    log('Нажали отправить сообщение: ' + messageInput.value)
    localStorage.setItem('getSomeHelp', '')
    await delay(2000);
    let timeout = getRandomNumber(20000, 120000)
    log('Ждем ' + timeout + ' милисекунд');
    await delay(timeout);
    document.querySelector('a[href*=teritory').click();
}