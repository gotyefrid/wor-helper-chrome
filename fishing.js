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
            processPrivateMessage();

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

function isMessageHasAlreadySent(text) {
    let lastStoredMessage = localStorage.getItem("lastPrivateMessage");

    if (lastStoredMessage && text.toString() == lastStoredMessage.toString()) {
        log(`Сообщение "${text}" уже было отправлено ранее`);
        return true;
    }

    return false;
}

function getPrivateLastPrivateMessage() {
    // Получаем все ссылки <a> на странице
    let message = [...document.querySelectorAll("#msg_box strong")].find(link => link.innerText.includes('для WheeL'))?.parentElement;

    if (!(message instanceof Object)) {
        return false;
    }

    let text = "";

    // Перебираем все дочерние узлы внутри message
    for (let node of message.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            // Если текстовый узел — добавляем текст
            text += node.textContent.trim() + " ";
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.tagName === "A" && node.onclick?.toString().includes("chatline.message.value")) {
                // Если это <a> с onclick для вставки смайла — достаем значение
                let match = node.onclick.toString().match(/'(.+?)'/);
                if (match) {
                    text += match[1] + " ";
                }
            } else {
                // Для других элементов берем их innerText
                text += node.innerText.trim() + " ";
            }
        }
    }

    return text.trim();
}

async function processSetFishingLocation() {
    let placeButtons = [...document.querySelectorAll(".btninv")]; // Получаем все кнопки

    let randomButton = placeButtons.length > 0
        ? placeButtons[Math.floor(Math.random() * placeButtons.length)]
        : false; // Выбираем случайную кнопку или false, если их нет

    if (randomButton) {
        randomButton.click();
    }
}

async function processPrivateMessage() {
    let lastMessageToMe = getPrivateLastPrivateMessage();

    if (!lastMessageToMe) {
        return;
    };

    if (!isMessageHasAlreadySent(lastMessageToMe)) {
        log('Есть новое сообщение, отправляем в ТГ');
        await delay(1000);
        sendTelegramMessage("ЛС: " + lastMessageToMe.toString());
        localStorage.setItem("lastPrivateMessage", lastMessageToMe);
    }
}
