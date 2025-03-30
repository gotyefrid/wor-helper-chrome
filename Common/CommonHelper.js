class CommonHelper {
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static async reloadPage() {
        location.reload();
        await CommonHelper.delay(100000);
    }

    static async clickAndWait(element, delay = 100000) {
        element.click();
        await CommonHelper.delay(delay);
    }

    static async log(message, showInFront = true, important, toConsole = true) {
        try {
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

    static async getRemoteTGUpdateId() {
        let result = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'getRemoteTGUpdateId' }, resolve);
        });

        if (result?.data?.wor_tg_last_update_id) {
            return parseInt(result.data.wor_tg_last_update_id, 10);
        }

        return 0;
    }

    static async setRemoteTGUpdateId(updateId) {
        return await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'setRemoteTGUpdateId', updateId: updateId }, resolve);
        });
    }

    static isRealPlayer(name) {
        return CommonHelper.playersList.some(player => name.includes(player));
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

    static async sendTelegramMessage(text, bot = 'common', notify = true, parseMode = 'html') {
        let { botToken, chatId } = await CommonHelper.getTgData(bot);

        if (!botToken || !chatId) {
            console.error('Нет возможности отправить сообщение в телеграм-бот. Укажите botToken и chatId в localStroage');
            return;
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
            console.error("❌ Ошибка: сообщение не может быть пустым!");
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
            console.error("❌ Ошибка при отправке сообщения:", error);
        }
    }

    static async getTelegramUpdates(bot = 'common') {
        let { botToken } = await CommonHelper.getTgData(bot);
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
                    { command: 'refresh_page', description: 'Перезагрзуить страницу' },
                    { command: 'to_exit_url', description: 'Перейти на сохранённый URL' },
                    { command: 'start_chemistry', description: 'Включить алхимию' },
                    { command: 'start_fishing', description: 'Включить рыбалку' },
                    { command: 'start_fighting', description: 'Включить сражение' }
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

    static async turnFighting(active = true) {
        await CommonHelper.setExtStorage('wor_fight_active', active);
    }

    static async turnBandits(active = true) {
        await CommonHelper.setExtStorage('wor_bandits_active', active);
    }

    static async turnFishing(active = true) {
        await CommonHelper.setExtStorage('wor_fishing_active', active);
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
        } else {
            CommonHelper.log('Запоминаем ссылку выхода из боя', false);
        }
        
        CommonHelper.setExtStorage('wor_fight_exit_url', url);
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
     * @returns {number} Количество часов травмы (0, если травмы нет).
     */
    getTraumaHours() {
        let travmaImg = document.querySelector('.chat')?.querySelector('img[src*="aid.gif"]');

        if (travmaImg) {
            let time = travmaImg.nextSibling?.textContent.trim().split(':');
            return parseInt(time[0]) || 0;
        }

        return 0;
    }

    static async parsingPage(url, textsToFind, type) {
        try {
            let response = await fetch(url, {
                method: 'GET',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/html'
                }
            });

            if (!response.ok) {
                CommonHelper.sendTelegramMessage(`Ошибка загрузки страницы (${type}):`, response.status);
                console.error(`Ошибка загрузки страницы (${type}):`, response.status);
                return;
            }

            let text = await response.text();

            let parser = new DOMParser();
            let newDocument = parser.parseFromString(text, 'text/html');
            let pageText = newDocument.body.innerText;

            const found = textsToFind.some(str => pageText.includes(str));

            if (found) {
                CommonHelper.sendTelegramMessage(`Парсинг нашёл что-то в: ${url}.`);
            } else {
                CommonHelper.log(`Не найдено ничего в ${type} (проверка на [${textsToFind.join(', ')}])`, false);
            }
        } catch (error) {
            console.error(`Ошибка при проверке ${type}:`, error);
        }
    }

    static playersList = [
        "Газ",
        "_RoN_",
        "Lycan",
        "-=FARSS=-",
        "LoseYourMind",
        "Іван",
        "Teddy Killerz",
        "Kiss Butterfly",
        "_-DoKeR-_",
        "Дональд Дак",
        "_BeN_",
        "Tipa40",
        "Счасливчик",
        "Killer Vova",
        "Mostik",
        "Rognarock",
        "BAPEHIK",
        "Gwatlow",
        "СвятоРус",
        "SelkeT",
        "Гордый даг",
        "White Magician",
        "mikimaus",
        "Benz",
        "Reinheart",
        "apolon war",
        "Хрум",
        "Misha",
        "SAV85",
        "-_-Next-_-",
        "=Thror=",
        "Wite_Angel",
        "LETOV",
        "Темный Кардинал",
        "undertacer",
        "Последний",
        "_SaNy_",
        "тгасе",
        "First blood",
        "V220V",
        "ХУДОЙ2020",
        "Jekson2010",
        "ЗУБРИК",
        "_Тоха_",
        "ZOXXAN",
        "Владлес",
        "Головка от патифона",
        "Flappy",
        "FBI open UP",
        "Dragon_Sword"
    ];

    static async isTraumaMoreOrEqual(more = 5) {
        try {
            let trauma = [...document.querySelectorAll('.status-item')].find(item => item.innerHTML.includes('Травма')).innerText.trim();

            if (!trauma) {
                return false;
            };

            [hour, minute] = trauma.split(':');
            hour = parseInt(hour, 10);

            if (trauma >= more) {
                return true;
            }

            return false;
        } catch (error) {
            CommonHelper.log('Произошла ошибка во время вычисления травмы, считаем что травмы много!');
            return true;
        }
    }
}