
putInfoBlock();

async function log(message, showInFront = true, important) {
    try {
        let result = await chrome.storage.local.get(["wor_log_active"]);

        if (showInFront) {
            let div = document.querySelector('#temp_block')
            div.textContent = message;
        }

        if (result.wor_log_active) { 
            console.log(message);
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
        .then(data => log("TG ответ:"  + data, false))
        .catch(error => console.error("Ошибка отправки в Telegram:", error));
}

function putInfoBlock(text, color) {
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