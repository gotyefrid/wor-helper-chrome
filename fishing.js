let fishingTimeout; // Глобальная переменная для хранения таймера
fishing();

async function fishing() {
    const result = await chrome.storage.local.get(["wor_fishing_active"]);

    if (fishingTimeout) {
        clearTimeout(fishingTimeout);
    } // Очищаем предыдущий таймер перед запуском нового

    async function runFishingLoop() {
        if (!result.wor_fishing_active) {
            log(`Бот рыбалки отключен`);
            return; // Если бот выключен или URL не соответствует разрешённым страницам, выходим
        }

        // значит экран выбор локации
        if (document.querySelector('.btninv')) {
            log('Выбираем место рыбалки');
            await delay(getRandomNumber(1000, 2000));
            await processSetFishingLocation();
        } else {
            log('Ждем загрузку страницы');
            await delay(getRandomNumber(500, 1000)); // ждем подгрузки аякс
            showTimeRequired();

            log('Смотрим есть ли новые приватные сообщения');
            await delay(getRandomNumber(500, 1000));
            await processLastPrivateMessage();

            await processGetFishButton();
        }

        // Запускаем новый вызов функции через случайный интервал, но ТОЛЬКО после завершения всех действий
        let randomDelay = getRandomNumber(1000, 5000);
        fishingTimeout = setTimeout(runFishingLoop, randomDelay);
    }

    // Первый вызов
    runFishingLoop();
}

function showTimeRequired() {
    // Находим <span> с id="mf"
    const mfElement = document.getElementById("mf");

    if (mfElement) {
        let nnValue = null;

        // Ищем <script>, содержащий "if (sec == NN)" (оптимизированный поиск)
        const script = [...document.scripts].find(s => s.textContent.includes("if (sec =="));

        if (script) {
            // Извлекаем NN быстрее через прямое регулярное выражение
            const match = script.textContent.match(/if \(sec == (\d+)\)/);
            if (match) {
                nnValue = match[1]; // Получаем NN
            }
        }

        if (nnValue !== null) {
            // Создаем новый <span> и вставляем после #mf (без лишних операций)
            mfElement.insertAdjacentHTML("afterend", `<span> из ${nnValue}</span>`);
        }
    }
}

async function processGetFishButton() {
    log("Ожидаем появление кнопки 'Подсечь!'...");

    return new Promise((resolve) => {
        // Выбираем элемент по ID
        const targetNode = document.getElementById("bp");

        // Создаем новый объект наблюдателя
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === "characterData" || mutation.type === "childList") {
                    (async () => {
                        let getButton = [...document.querySelectorAll("strong")]
                            .find(strong => strong.innerText.includes("Подсечь"));

                        if (getButton) {
                            log("Подсекаем!");
                            await delay(getRandomNumber(2000, 4000)); // Ждем перед нажатием
                            observer.disconnect(); // Останавливаем наблюдение
                            getButton.click();

                            resolve(); // Завершаем `processGetFishButton`
                        }
                    })();
                }
            }
        });

        // Настройки для отслеживания изменений
        const config = { characterData: true, childList: true, subtree: true };

        // Запускаем наблюдение
        observer.observe(targetNode, config);
    });
}

async function processSetFishingLocation() {
    let placeButtons = [...document.querySelectorAll(".btninv")]; // Получаем все кнопки
    let needFishName = 'cудак'.toLowerCase();
    let locationIndex = Math.floor(Math.random() * placeButtons.length);

    let savedLocation = localStorage.getItem('lastFishingLocationIndex');

    if (getLastFishName().toLowerCase().includes(needFishName) && savedLocation !== null && savedLocation !== '') {
        locationIndex = Number(savedLocation); // Преобразуем в число, если значение есть
    }

    let button = placeButtons.length > 0
        ? placeButtons[locationIndex]
        : false; // Выбираем кнопку или false, если их нет

    if (button) {
        localStorage.setItem('lastFishingLocationIndex', locationIndex);
        button.click();
        return;
    }

    log('Почему то не нашлись кнопки выбора локации');
    sendTelegramMessage('Почему то не нашлись кнопки выбора локации');
}

async function getLastFishName() {
    let searchStr = 'Вы подсекли и выловили трофейного';
    let lastFishNameElement = [...document.querySelectorAll('span.svet')]
        .find(span => span.textContent.includes(searchStr))
        ?.textContent
        .replace(searchStr, '')
        .trim();

    return lastFishNameElement ? lastFishNameElement : '';
}
