async function start() {
    const allow = [
        "/wap/lovit",
        "/wap/chat"
    ];

    if (!allow.some(path => document.location.href.includes(path))) {
        log("Скрипт проверки чата остановлен.", false);
        return;
    }

    log('Смотрим есть ли новые приватные сообщения', false);
    processLastPrivateMessage();
}


function isMessageHasAlreadySent(text) {
    let lastStoredMessage = localStorage.getItem("lastPrivateMessage");

    if (lastStoredMessage && text.toString() == lastStoredMessage.toString()) {
        log(`Сообщение "${text}" уже было отправлено ранее`, false);
        return true;
    }

    return false;
}


async function processLastPrivateMessage() {
    let lastMessageToMe = getLastPrivateMessage();

    if (!lastMessageToMe) {
        return;
    };

    let messageText = `ЛС: ${lastMessageToMe.time} | От: ${lastMessageToMe.from} | ${lastMessageToMe.text}`;

    if (!isMessageHasAlreadySent(messageText)) {
        log('Есть новое сообщение, отправляем в ТГ');
        await delay(1000);

        sendTelegramMessage(messageText);
        localStorage.setItem("lastPrivateMessage", messageText);
        log('');
    }
}

function getLastPrivateMessage() {
    let messages = getParsedMessages(); // Получаем массив сообщений

    // Находим первое сообщение, адресованное "WheeL" и не являющееся системой
    let foundMessage = messages.find(msg => msg.to === "WheeL" && msg.type !== "система");

    return foundMessage || null; // Если найдено, возвращаем его, иначе null
}

function getParsedMessages() {
    // Получаем все div'ы с id "msg_box"
    let msgBoxes = document.querySelectorAll("div#msg_box");

    let messages = [];

    msgBoxes.forEach(msgBox => {
        // Разбиваем содержимое <div> по <br>
        let parts = msgBox.innerHTML.split("<br>");

        parts.forEach(part => {
            // Создаём временный div для проверки содержимого
            let tempDiv = document.createElement("div");
            tempDiv.innerHTML = part.trim();

            // Проверяем, есть ли внутри элемент с классом "navigation"
            if (tempDiv.querySelector(".navigation")) {
                return; // Пропускаем итерацию
            }

            // Если контент не пустой, добавляем в messages
            if (tempDiv.innerHTML !== "") {
                messages.push(tempDiv);
            }
        });
    });

    let pureTexts = messages.map(element => {
        // Проверяем, есть ли в элементе дочерний элемент с классом "svet"
        let isSystem = element.querySelector(".svet") !== null;

        // Извлекаем текст из текстовых узлов и элементов с innerText + смайлы
        let extractedText = Array.from(element.childNodes)
            .map(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.nodeValue.trim();
                }
                else if (node.nodeType === Node.ELEMENT_NODE) {
                    // Проверяем, является ли элемент ссылкой <a> со смайлом <img>
                    let smileImg = node.querySelector("img");
                    if (smileImg && node.hasAttribute("onclick")) {
                        // Извлекаем идентификатор смайла из onclick
                        let match = node.getAttribute("onclick").match(/'(.+?)'/);
                        if (match) {
                            return match[1].trim(); // Добавляем идентификатор смайла
                        }
                    }

                    // В остальных случаях просто берём текст элемента
                    return node.innerText.trim();
                }
                return "";
            })
            .filter(text => text.length > 0) // Исключаем пустые строки
            .join(" "); // Объединяем в строку

        // Добавляем "система" или "чат" в начало строки
        return (isSystem ? "система" : "чат") + " " + extractedText;
    });

    let parsedMessages = pureTexts.map(msg => {
        // Разбиваем строку на части
        let parts = msg.split(/\s+/); // Разделяем по пробелам

        // Определяем тип (первое слово в строке)
        let type = parts.shift(); // "система" или "чат"

        // Вытаскиваем время (оно всегда в формате HH:MM:SS)
        let time = parts.shift();

        // Остальную часть склеиваем обратно в строку
        let remainingText = parts.join(" ");

        let from = "system"; // По умолчанию для "система"
        let to = "";
        let text = remainingText; // Пока считаем, что весь остаток — это текст

        // Если это "чат", то парсим from и to
        if (type === "чат") {
            let match = remainingText.match(/^(.*?):\s*(.*?)$/); // Регулярка для поиска "Игрок: текст" или "Игрок для Игрок2: текст"
            if (match) {
                from = match[1]; // Игрок, который отправил сообщение
                text = match[2]; // Оставшийся текст

                // Проверяем, есть ли "для {игрок}" внутри from
                let toMatch = from.match(/(.*?)\s+для\s+(.*)/);
                if (toMatch) {
                    from = toMatch[1].trim(); // Исправляем имя отправителя
                    to = toMatch[2].trim(); // Имя получателя
                }
            }
        }

        return { type, time, from, to, text };
    });

    return parsedMessages;
}
