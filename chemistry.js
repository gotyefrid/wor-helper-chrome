let alchemistryTimeout; // Глобальная переменная для хранения таймера

start();

async function start() {
    const allow = [
        "/wap/poisktrav",
        "/wap/teritory",
        "/wap/boj",
        "/wap/wait",
        "/wap/logfull",
    ];

    if (document.location.href.includes('chat') && localStorage.getItem('getSomeHelp')) {
        await getSomeHelpFromChat(localStorage.getItem('getSomeHelp'));
        return;
    } else if (!allow.some(path => document.location.href.includes(path))) {
        log("Алхимия на этой странице выключена", false);
        return;
    }

    alchemistry();
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
        'снос .2pistoleta.'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    messageInput.value = `[log]${fightNumber}[/log] ${randomMessage}`;

    sendMessageButton.click();
    log('Нажали отправить сообщение: ' + messageInput.value)
    localStorage.setItem('getSomeHelp', '')
    await delay(2000);
    log('Ждем некоторое время');
    await delay(getRandomNumber(20000, 120000));
    document.querySelector('a[href*=teritory').click();
}

async function alchemistry() {
    const result = await chrome.storage.local.get(["wor_alchemistry_active"]);

    if (alchemistryTimeout) {
        clearTimeout(alchemistryTimeout);
    } // Очищаем предыдущий таймер перед запуском нового

    async function runalchemistryLoop() {
        if (!result.wor_alchemistry_active) {
            log(`Бот алхимии отключен`, false);
            return;
        }

        if (document.querySelector('#progressBar')) {
            let travmaImg = document.querySelector('.chat').querySelector('img[src*="aid.gif"');

            if (travmaImg) {
                let time = travmaImg.nextSibling.textContent.trim().split(':');
                let hour = paresInt(time[0]);

                if (hour >= 4) {
                    await chrome.storage.local.set({ ['wor_alchemistry_active']: false });
                    sendTelegramMessage('Алхимия остановлена, у меня травма. Ушёл в город');
                    [...document.querySelectorAll('a')].find(text => text.innerText.includes('Главное меню')).click();
                    return;
                }
            }

            log('Ждем кнопки Собрать');
            log('Запоминаем ссылку lastPoiskTravUrl', false);
            localStorage.setItem('lastPoiskTravUrl', document.location.href)

            let chatBox = document.querySelector('#msg_box');

            processLastPrivateMessage();

            let contur = chatBox ? chatBox.querySelector('.contur') : null;

            if (chatBox && contur && contur.textContent.includes('В бой:')) {
                location.reload();
            }
        }

        if ((sobrat = document.querySelector('input[value=Собрать]'))) {
            log('Собираем');
            localStorage.setItem('lastSobratUrl', document.location.href)
            await delay(getRandomNumber(1000, 3000));
            sobrat.click();
            return;
        }

        if (startPoisk = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Осмотреться'))) {
            log('Жмём Осмотреться');
            log('Очищаем lastSobratUrl', false);
            localStorage.setItem('lastSobratUrl', '')
            await delay(getRandomNumber(1000, 3000));
            startPoisk.click();
            return;
        }

        let exit = null;
        let udarit = null;

        if (
            (udarit = document.querySelector('input[name=bitvraga]')) ||
            (exit = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Выход из боя'))) ||
            document.location.href.includes('wait')
        ) {
            let negativeMobs = [
                'Дарбутар [25]',
                'Абигор [26]',
            ];

            if (negativeMobs.some(mob => document.body.innerText.toLowerCase().includes(mob.toLocaleLowerCase()))) {
                if (exit) {
                    exitFromFight();
                    return;
                } else if (document.location.href.includes('wait')) {
                    await delay(2000);
                    return;
                }

                let toChatLink = document.querySelector('a[href*=tochat]')
                let fightNumber = new URLSearchParams(new URL(toChatLink).search).get("text");
                sendTelegramMessage('Напал моб из стоп листа');
                localStorage.setItem('getSomeHelp', fightNumber)
                toChatLink.click();
                return;
            }

            if (udarit) {
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

                udarit.click();
                return;
            } else if (exit) {
                exitFromFight();
                return;
            }

            await delay(getRandomNumber(500, 1000));
            location.reload();
            return;
        }

        if (
            (priroda = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Природа'))) &&
            !document.location.href.includes('poisktrav')
        ) {
            log('Выходим на природу');
            await delay(getRandomNumber(1000, 3000));
            priroda.click();
        }

        // Запускаем новый вызов функции через случайный интервал, но ТОЛЬКО после завершения всех действий
        let randomDelay = getRandomNumber(1000, 5000);
        alchemistryTimeout = setTimeout(runalchemistryLoop, randomDelay);
    }

    // Первый вызов
    runalchemistryLoop();
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
        log('Переходим по ссылке поиск-трав lastPoiskTravUrl');
        document.location = lastPoiskTravUrl;
        return;
    }

    log('Переходим по ссылке /wap/teritory.php');
    document.location = lastPoiskTravUrl ? lastPoiskTravUrl : '/wap/teritory.php';

}