class CommonHelper {
    static EXTRA_SMALL_RANDOM = CommonHelper.getRandomNumber(100, 300);
    static SMALL_RANDOM = CommonHelper.getRandomNumber(300, 700);
    static SMALL_MID_RANDOM = CommonHelper.getRandomNumber(500, 1000);
    static MEDIUM_RANDOM = CommonHelper.getRandomNumber(1000, 3000);
    static LARGE_RANDOM = CommonHelper.getRandomNumber(3000, 5000);
    static EXTRA_LARGE_RANDOM = CommonHelper.getRandomNumber(5000, 7000);
    static XXL_RANDOM = CommonHelper.getRandomNumber(7000, 15000);

    static delay(msFrom, msTo = null) {
        let ms = 0;

        if (msTo) {
            ms = CommonHelper.getRandomNumber(msFrom, msTo)
        } else {
            ms = msFrom;
        }

        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static async reloadPage() {
        location.reload();
        await CommonHelper.delay(100000);
    }

    static async getAutoMoveDelay(defaultValue = [50, 100]) {
        // получаем строку из хранилища
        const delay = await CommonHelper.getExtStorage('wor_map_move_delay');

        // если нет значения — возвращаем defaultValue
        if (!delay) {
            return defaultValue;
        }

        // пробуем распарсить: одна или две группы цифр через запятую
        const m = delay.match(/^(\d+)(?:,(\d+))?$/);
        if (!m) {
            // если формат неправильный — тоже возвращаем defaultValue
            return defaultValue;
        }

        const first = parseInt(m[1], 10);
        // если второй номер не задан, используем тот же самый
        const second = m[2] !== undefined
            ? parseInt(m[2], 10)
            : first;

        return [first, second];
    }

    static async clickAndWait(element, delay = 100000) {
        element.click();
        await CommonHelper.delay(delay);
    }

    static async log(message, showInFront = true, important, toConsole = true) {
        try {
            const time = (new Date()).toLocaleTimeString('ru-RU', { hour12: false });

            message = time + ' ' + message;
            let logActive = await CommonHelper.getExtStorage('wor_log_active');

            if (showInFront) {
                // CommonHelper.putInfoBlock();
                // let div = document.querySelector('#temp_block')
                // div.textContent = message;
            }

            if (toConsole) {
                if (logActive) {
                    console.log(message);
                }
            }

            if (important) {
                console.log(message);
            }
        } catch (error) {
        }
    }

    static putInfoBlock(text, color) {
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

    static getLocalStorage(key) {
        return localStorage.getItem(key);
    }

    static setLocalStorage(key, value) {
        localStorage.setItem(key, value);
    }

    static deleteLocalStorage(key) {
        localStorage.removeItem(key);
    }

    static async getExtStorage(key) {
        let result = await chrome.storage.local.get([key]);

        if (result[key] !== undefined) {
            return result[key];
        }

        return null;
    }

    static async setExtStorage(key, value) {
        await chrome.storage.local.set({ [key]: value });
    }


    static async getTgData(bot = 'common') {
        let botToken;
        let chatId = await CommonHelper.getExtStorage('wor_tg_chat_id');

        switch (bot) {
            case 'chat':
                botToken = await CommonHelper.getExtStorage('wor_tg_bot_chat_token');
                break;
            default:
                botToken = await CommonHelper.getExtStorage('wor_tg_bot_common_token');
        }

        return { botToken, chatId };
    }

    static async sendTelegramMessage(text, bot = 'common', notify = true, parseMode = 'html', expireInSeconds = 60) {
        let notification = await CommonHelper.getExtStorage('wor_tg_notifications_active');

        if (!notification) {
            return;
        }

        let { botToken, chatId } = await CommonHelper.getTgData(bot);

        if (!botToken || !chatId) {
            CommonHelper.log('Нет возможности отправить сообщение в телеграм-бот. Укажите botToken и chatId в localStroage');
            return;
        }

        if (bot === 'common') {
            const now = Math.floor(Date.now() / 1000);

            const lastMessage = await CommonHelper.getExtStorage('wor_tg_common_last_message');
            const isSameText = lastMessage?.text === text;
            const isNotExpired = lastMessage && (now - lastMessage.timestamp) < lastMessage.expire;

            if (isSameText && isNotExpired) {
                CommonHelper.log('Сообщение уже отправлялось недавно. Пропускаем отправку.');
                return;
            }

            await CommonHelper.setExtStorage('wor_tg_common_last_message', {
                text,
                timestamp: now,
                expire: expireInSeconds,
            });
        }

        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: chatId,
                text: text,
                parse_mode: parseMode,
                disable_notification: !notify
            })
        }).then(response => response.json())
            .then(() => CommonHelper.log("Отправили сообщение в Телеграм", false))
            .catch(error => CommonHelper.log("Ошибка отправки в Telegram:" + JSON.stringify(error), false));
    }

    static async sendMessageToChat(message, recipient = null, privateMessage = false) {
        if (!message || typeof message !== "string") {
            CommonHelper.log("❌ Ошибка: сообщение не может быть пустым!");
            return;
        }

        const formData = new URLSearchParams();
        formData.append("message", message);

        // Если указан получатель, добавляем его в параметры
        if (recipient) {
            formData.append("komy", recipient);
        }

        // Если сообщение приватное, ставим флаг
        if (privateMessage) {
            formData.append("privat", "1");
        }

        try {
            const response = await fetch("/wap/otpravit.php?js=1", {
                method: "POST",
                headers: {
                    "accept": "*/*",
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "x-requested-with": "XMLHttpRequest"
                },
                body: formData,
                credentials: "include"
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            CommonHelper.log("✅ Сообщение успешно отправлено: " + message);
        } catch (error) {
            CommonHelper.log("❌ Ошибка при отправке сообщения:" + JSON.stringify(error));
        }
    }

    static async getTelegramUpdates(bot = 'common') {
        let { botToken } = await CommonHelper.getTgData(bot);
        if (!botToken) {
            return null;
        }
        const url = `https://api.telegram.org/bot${botToken}/getUpdates`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (!data.ok) return null;

            const updates = data.result;
            if (updates.length === 0) return null;

            const formatted = updates.map(update => ({
                update_id: update.update_id,
                time: update.message?.date * 1000,
                message: update.message?.text?.trim()
            })).filter(msg => msg.message);

            let lastMessage = formatted.pop();
            // Фиксируем чтобы больше этого же не пришло
            await fetch(url + `?offset=${lastMessage.update_id + 1}`);

            return lastMessage;
        } catch (error) {
            CommonHelper.log("Ошибка при получении обновлений от Telegram:" + JSON.stringify(error));
            return null;
        }
    }

    static async setTelegramBotCommands(bot = 'chat') {
        let { botToken } = await CommonHelper.getTgData(bot);
        const url = `https://api.telegram.org/bot${botToken}/setMyCommands`;
        await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                commands: [
                    { command: 'stop', description: 'Остановить бота' },
                    { command: 'status', description: 'Статусы бота' },
                    { command: 'chemistry', description: 'Aлхимия' },
                    { command: 'fishing', description: 'Рыбалка' },
                    { command: 'bandits', description: 'Разбойники' },
                    { command: 'captcha', description: 'Капча' },
                    { command: 'fighting', description: 'Сражение' },
                    { command: 'refresh_page', description: 'Перезагрузить страницу' },
                    { command: 'to_exit_url', description: 'Перейти на сохранённый URL' },
                    { command: 'to_gorod', description: 'Телепорт в город' },
                    { command: 'refresh_commands_list', description: 'Обновить команды' }
                ]
            })
        })
            .then(res => res.json())
            .catch(err => CommonHelper.log('Ошибка: ' + JSON.stringify(err)));
    }

    static currentTime() {
        return Math.floor(Date.now() / 1000);
    }

    static async turnAlchemistry(active = true) {
        await CommonHelper.setExtStorage('wor_chemistry_active', active);
    }

    static async turnMining(active = true) {
        await CommonHelper.setExtStorage('wor_mining_active', active);
    }

    static async turnFighting(active = true) {
        await CommonHelper.setExtStorage('wor_fight_active', active);
    }

    static async turnBandits(active = true) {
        await CommonHelper.setExtStorage('wor_bandits_active', active);
    }

    static async turnFishing(active = true) {
        await CommonHelper.setExtStorage('wor_fishing_active', active);
    }

    static async turnCaptcha(active = true) {
        await CommonHelper.setExtStorage('wor_captcha_active', active);
    }

    static async createDisableButton(name, toDo) {
        (function () {
            // Определяем количество уже существующих кнопок
            let existingButtons = document.querySelectorAll("button[id^='disableButton']").length;

            // Создаем кнопку
            let button = document.createElement("button");
            button.textContent = name;
            button.id = `disableButton${existingButtons + 1}`;

            // Добавляем стили для кнопки
            button.style.position = "fixed";
            button.style.top = `${10 + (existingButtons * 50)}px`; // Смещаем вниз на 50px за каждую кнопку
            button.style.left = "10px";
            button.style.zIndex = "9999";
            button.style.backgroundColor = "#ff4d4d";
            button.style.color = "#fff";
            button.style.border = "none";
            button.style.borderRadius = "50px";
            button.style.padding = "10px 15px";
            button.style.fontSize = "14px";
            button.style.cursor = "pointer";
            button.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)";
            button.style.transition = "background 0.3s, transform 0.1s";

            // Добавляем эффект нажатия
            button.addEventListener("mousedown", () => {
                button.style.transform = "scale(0.95)";
            });

            button.addEventListener("mouseup", () => {
                button.style.transform = "scale(1)";
            });

            // Добавляем ховер-эффект
            button.addEventListener("mouseover", () => {
                button.style.backgroundColor = "#d43f3f";
            });

            button.addEventListener("mouseout", () => {
                button.style.backgroundColor = "#ff4d4d";
            });

            // Добавляем кнопку в документ
            document.body.appendChild(button);

            // Добавляем обработчик клика
            button.addEventListener("click", async () => {
                if (typeof toDo === "function") {
                    toDo();
                }
            });
        })();
    }

    static async setFightExitUrl(url) {
        if (!url) {
            CommonHelper.log('Очищаем ссылку выхода из боя', false);
            // Можно сразу очистить
            await CommonHelper.setExtStorage('wor_fight_exit_url', null);
            return;
        } else {
            CommonHelper.log('Запоминаем ссылку выхода из боя', false);
        }

        // Вычисляем timestamp истечения через 2 минуты
        const expireAt = Date.now() + 2 * 60 * 1000; // мс

        // Сохраняем объект с ссылкой и временем жизни
        await CommonHelper.setExtStorage('wor_fight_exit_url', {
            link: url,
            expire: expireAt
        });
    }

    static async getFightExitUrl() {
        const data = await CommonHelper.getExtStorage('wor_fight_exit_url');
        if (!data) {
            // ничего нет
            return null;
        }

        const { link, expire } = data;

        // Если истёк
        if (typeof expire === 'number' && Date.now() > expire) {
            // Можно сразу очистить
            await CommonHelper.setExtStorage('wor_fight_exit_url', null);
            return null;
        }

        // Ещё живо — отдаем ссылку
        return link;
    }

    /**
     * Ожидает появления или исчезновения элемента на странице.
     *
     * @param {string} selector - CSS-селектор элемента, который нужно отследить.
     * @param {boolean} [shouldExist=true] - `true`, если ожидаем появления элемента; `false`, если ожидаем исчезновения.
     * @param {function|null} [addConditionCallback=null] - Дополнительная функция-условие (принимает элемент, должна вернуть `true`, если элемент удовлетворяет условиям).
     * @param {number|null} [timeout=null] - Максимальное время ожидания (в миллисекундах). Если `null`, таймаут отсутствует.
     * @param {number} [checkInterval=500] - Интервал проверки наличия элемента (в миллисекундах).
     * @returns {Promise<boolean>} Промис, который разрешается `true`, если условие выполнено, и `false`, если истек таймаут.
     *
     * @example
     * // Ожидание появления элемента с ID "myElement"
     * waitForElement("#myElement").then(found => {
     *     console.log(found ? "Элемент найден!" : "Элемент не появился в течение таймаута.");
     * });
     *
     * @example
     * // Ожидание исчезновения элемента с классом "loading"
     * waitForElement(".loading", false).then(disappeared => {
     *     console.log(disappeared ? "Элемент исчез!" : "Элемент остался на странице.");
     * });
     *
     * @example
     * // Ожидание появления элемента с определенным текстом
     * waitForElement("#status", true, el => el.textContent.includes("Готово")).then(ready => {
     *     console.log(ready ? "Элемент содержит 'Готово'!" : "Таймаут.");
     * });
     */
    static waitForElement(selector, shouldExist = true, addConditionCallback = null, timeout = null, checkInterval = 500) {
        return new Promise((resolve) => {
            let startTime = Date.now();

            let check = setInterval(() => {
                // Проверяем, истёк ли таймаут
                if (timeout && Date.now() - startTime >= timeout) {
                    clearInterval(check);
                    resolve(false);
                    return;
                }

                let element = document.querySelector(selector); // Проверяем, существует ли элемент

                // Если ждем, что элемент пропадет, и он уже пропал — сразу выходим
                if (!shouldExist && element === null) {
                    clearInterval(check);
                    resolve(true);
                    return;
                }

                // Если ждем, что элемент появится, но его нет — продолжаем ждать
                if (shouldExist && element === null) {
                    return;
                }

                // Если передан колбэк и мы ждем появления элемента — проверяем доп. условие
                if (shouldExist && typeof addConditionCallback === "function") {
                    if (addConditionCallback(element)) {
                        clearInterval(check);
                        resolve(true);
                    }
                    return; // Если колбэк не прошел, продолжаем ждать
                }

                // Если элемент найден (и нет колбэка, либо он не нужен) — завершаем ожидание
                clearInterval(check);
                resolve(true);
            }, checkInterval);
        });
    }

    static askWithTimeout(message, timeout = 30000) {
        return new Promise((resolve) => {
            // HTML-разметка модального окна + встроенные стили
            let modalHTML = `
            <style>
                #custom-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: transparent;
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    align-items: flex-start;
                    padding-top: 20px;
                }
                #custom-modal {
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    width: 300px;
                    position: relative;
                }
                .custom-modal-buttons {
                    margin-top: 10px;
                }
                .custom-modal-buttons button {
                    padding: 5px 15px;
                    border: none;
                    font-size: 14px;
                    cursor: pointer;
                }
                #modal-yes {
                    background: #4CAF50;
                    color: white;
                    margin-right: 10px;
                }
                #modal-no {
                    background: #f44336;
                    color: white;
                }
                p {
                    color: black;
                }
            </style>
            <div id="custom-modal-overlay">
                <div id="custom-modal">
                    <p>${message}</p>
                    <div class="custom-modal-buttons">
                        <button id="modal-yes">Да</button>
                        <button id="modal-no">Нет</button>
                    </div>
                </div>
            </div>
            `;

            // Вставляем HTML в `body`
            document.body.insertAdjacentHTML("beforeend", modalHTML);

            let modalOverlay = document.getElementById("custom-modal-overlay");
            let modal = document.getElementById("custom-modal");

            // Клик на кнопку "Да"
            document.getElementById("modal-yes").onclick = () => {
                resolve(true);
                modalOverlay.remove();
            };

            function stop(resolve, modalOverlay) {
                window.onbeforeunload = () => {
                };
                CommonHelper.log('Ботинг приостановлен на этой странице');
                resolve(false);
                modalOverlay.remove();
            }

            // Клик на кнопку "Нет"
            document.getElementById("modal-no").onclick = () => stop(resolve, modalOverlay);


            // Закрытие при клике вне модального окна
            modalOverlay.onclick = (event) => {
                if (!modal.contains(event.target)) stop(resolve, modalOverlay);
            };

            // Авто-закрытие через timeout
            setTimeout(() => {
                if (document.getElementById("custom-modal-overlay")) {
                    resolve(true); // Если не ответили, считаем как "Да"
                    modalOverlay.remove();
                    CommonHelper.log("Время ожидания отмены ботинга истекло. Продолжаем код.");
                }
            }, timeout);
        });
    }

    /**
     * Получает количество часов травмы из чата (если есть значок aid.gif).
     *
     * @param {boolean} inMinutes - Если true, возвращает количество минут, иначе строку вида "2:44".
     * @returns {number|string} Строка "чч:мм" или число минут, либо 0 если травмы нет.
     */
    static getTraumaTime(inMinutes = false) {
        const travmaImg = document.querySelector('.chat')?.querySelector('img[src*="aid.gif"]');

        if (travmaImg) {
            const timeText = travmaImg.nextSibling?.textContent?.trim();

            if (timeText && /^\d+:\d+$/.test(timeText)) {
                const [hours, minutes] = timeText.split(':').map(Number);
                const totalMinutes = hours * 60 + minutes;
                return inMinutes ? totalMinutes : timeText;
            }
        }

        return 0;
    }

    static async parsingPage(url, textsToFind, type, invert = false) {
        try {
            let response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/html'
                }
            });

            if (!response.ok) {
                CommonHelper.sendTelegramMessage(`Ошибка загрузки страницы (${type}):` + response.status);
                CommonHelper.log(`Ошибка загрузки страницы (${type}):` + response.status);
                return;
            }

            let text = await response.text();

            let parser = new DOMParser();
            let newDocument = parser.parseFromString(text, 'text/html');
            let pageText = newDocument.body.innerText;

            let found = textsToFind.some(str => pageText.includes(str));

            // Если ждём что на странице НЕ будет текста 
            if (invert) {
                found = !found;
            }

            if (found) {
                CommonHelper.sendTelegramMessage(`Успех! Парсинг ${invert ? 'не' : ''} нашёл что-то искомое в: ${url}.`);
            } else {
                CommonHelper.log(`Неудача. Не найдено ничего в ${type} (проверка на [${textsToFind.join(', ')}])`, false);
            }
        } catch (error) {
            CommonHelper.log(`Ошибка при проверке ${type}:` + JSON.stringify(error));
        }
    }

    static async fetchChat() {
        try {
            let chatUrl = document.querySelector('a[href*=chat2]')?.href;

            if (!chatUrl) {
                CommonHelper.log('Нету ссылки на чат');
                return null;
            }

            let result = await fetch(chatUrl);
            let html = await result.text();

            let parser = new DOMParser();
            let htmlPage = parser.parseFromString(html, 'text/html');
            let msgBox = htmlPage.querySelector('#msg_box');
            let formattedMessages = Chat.getParsedMessages(msgBox);

            return formattedMessages;
        } catch (err) {
            CommonHelper.log('Ошибка при получении сообщений чата: + ', JSON.stringify(err));
        }
    }

    /**
     * Возвращает значение GET-параметра из текущего URL.
     * @param {string} name – имя параметра (без «?»).
     * @return {string|null} значение параметра или null, если не найден.
     */
    static getQueryParam(name) {
        // Создаём объект URL из адреса текущей страницы
        const url = new URL(window.location.href);
        // Используем встроенный интерфейс URLSearchParams
        return url.searchParams.get(name);
    }
}