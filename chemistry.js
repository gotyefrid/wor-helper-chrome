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

    async function runalchemistryLoop() {
        if (!result.wor_alchemistry_active) {
            log(`Бот алхимии отключен`);
            return;
        }

        if (document.querySelector('#progressBar')) {
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

        if (
            (udarit = document.querySelector('input[name=bitvraga]')) ||
            (exit = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Выход из боя'))) ||
            document.location.href.includes('wait')
        ) {

            if (document.querySelector('body').innerText.includes('Дарбутар [24]')) {
                sendTelegramMessage('Напал ДАРБУТАР! СРОЧНО УБИТЬ РУЧКАМИ');
            }

            if (udarit) {
                log('Атакуем');
                await delay(getRandomNumber(500, 2000));
                udarit.click();
                return;
            } else if (exit) {
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