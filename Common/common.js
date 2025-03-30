async function log(message, showInFront = true, important, toConsole = true) {
    try {
        let result = await chrome.storage.local.get(["wor_log_active"]);

        if (showInFront) {
            putInfoBlock();
            let div = document.querySelector('#temp_block')
            div.textContent = message;
        }

        if (toConsole) {
            if (result.wor_log_active) {
                console.log(message);
            }
        }

        if (important) {
            console.log(message);
            return;
        }
    } catch (error) { }
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomNumber(min, max) {
    number = Math.floor(Math.random() * (max - min + 1)) + min;
    return number;
}

function sendTelegramMessage(text) {
    const botToken = localStorage.getItem('botToken');
    const chatId = localStorage.getItem('chatId');

    if (!botToken || !chatId) {
        console.error('Нет возможности отправить сообщение в телеграм-бот. Укажите botToken и chatId в localStroage');
        return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: text })
    }).then(response => response.json())
        .then(data => log("TG ответ:" + data, false))
        .catch(error => console.error("Ошибка отправки в Telegram:", error));
}

function putInfoBlock(text, color) {
    if (document.querySelector("#temp_block")) {
        return;
    }

    // Находим оригинальный элемент с классом 
    let chatElements = document.querySelectorAll(".chat");
    let originalElement = chatElements[chatElements.length - 1]; // Берём последний элемент

    if (originalElement) {
        // Клонируем элемент
        let clonedElement = originalElement.cloneNode(true);

        clonedElement.innerHTML = '';

        let element = document.createElement("div");

        element.id = 'temp_block';
        element.style.textAlign = "center";

        clonedElement.appendChild(element);
        // и вставить этот element в clonedElement.innerHtml

        // Вставляем клонированный элемент сразу после оригинала
        originalElement.parentNode.insertBefore(clonedElement, originalElement.nextSibling);
    }
}

document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.altKey && event.key === "0") {
        console.log("Ctrl + Alt + 0 нажаты!");
        turnOffAlchemistry();
        turnOffFishing();
        document.location.reload();
    }
});



async function turnOffAlchemistry() {
    await chrome.storage.local.set({ ['wor_chemistry_active']: false });
}

async function turnOffFishing() {
    await chrome.storage.local.set({ ['wor_fishing_active']: false });
}

function mergeContent() {
    log('Объединяем вещи', false);
    // Находим все div с классом invcell
    const invCells = document.querySelectorAll("div.invcell");

    // Создаем карту для хранения текста itemlink и соответствующих div.invcell
    const itemMap = new Map();

    invCells.forEach(invCell => {
        const itemLink = invCell.querySelector("a[href^='itemlink']");
        if (itemLink) {
            const itemText = itemLink.nextSibling.textContent.trim();
            if (!itemMap.has(itemText)) {
                itemMap.set(itemText, []);
            }
            itemMap.get(itemText).push(invCell);
        }
    });

    // Проходим по сохраненным данным и открываем новую вкладку, если itemText встречается более одного раза
    itemMap.forEach((cells, itemText) => {
        if (cells.length > 1) { // Если такой же текст есть в нескольких div.invcell
            let tosoedLink = cells[0].querySelector("a[href^='tosoed']");
            if (tosoedLink) {
                let href = tosoedLink.href;

                // Открываем новую вкладку
                window.open(href, "_blank");
            }
        }
    });
}


if (document.location.href.includes('forum=12&topic=2289')) {
    sendRandomFact();
}

async function sendRandomFact() {
    try {
        log("Запрашиваем случайный факт...");

        // Запрашиваем случайный факт
        let res = await fetch("http://numbersapi.com/random/trivia");

        if (res.status !== 200) {
            // Если статус ответа не 200, прекращаем выполнение
            console.error("Ошибка: не удалось получить данные");
            return;
        }

        let factText = await res.text();
        // Переводим факт
        let translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(factText)}&langpair=en|ru`;
        let translatedText = await fetch(translateUrl).then(res => res.json()).then(data => data.responseData.translatedText);

        log("Получен факт: " + translatedText);

        if (translatedText.includes('MYMEMORY WARNING')) {
            log("Получена ошибка, выходим");
            return;
        }

        let waitTime = getRandomNumber(60000, 90000); // Генерируем случайное время ожидания (60-90 сек)
        log(`Ожидание ${Math.floor(waitTime / 1000)} секунд перед публикацией...`);

        // Таймер обратного отсчёта
        let remainingTime = Math.floor(waitTime / 1000);
        let timer = setInterval(() => {
            remainingTime--;
            log(`Осталось ${remainingTime} секунд...`, true, 0, false);
            if (remainingTime <= 0) clearInterval(timer);
        }, 1000);

        // Ждём перед отправкой
        await new Promise(resolve => setTimeout(resolve, waitTime));

        log("Готовимся к отправке сообщения...");

        // Поиск формы
        let form = document.querySelector('form');
        if (!form) return log("Форма не найдена!");

        // Поиск текстового поля
        let inputField = form.querySelector('textarea[name="textmes"]');
        if (!inputField) return log("Поле ввода не найдено!");

        // Вставляем сообщение
        inputField.value = translatedText;

        // Отправляем форму
        let submitButton = form.querySelector('input[type="submit"]');
        if (submitButton) {
            log("Сообщение отправлено!");
            submitButton.click();
        } else {
            log("Кнопка отправки не найдена!");
        }

    } catch (error) {
        console.error("Ошибка:", error);
    }
}