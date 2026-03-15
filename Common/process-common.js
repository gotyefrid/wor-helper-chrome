(async function () {

    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    setTitle();
    checkFlashNotifications();
    checkTrauma();

    const isParsingActive = await CommonHelper.getExtStorage('wor_parsing_active');

    if (isParsingActive) {
        parsing();
    }

    backgroundListener();
})();

async function checkTrauma() {
    const currentTime = CommonHelper.getTraumaTime(true);

    // достаём из хранилища и сразу приводим к числу
    const raw = await CommonHelper.getExtStorage('wor_fight_last_trauma_minutes');
    let lastSavedTime = Number(raw);

    // если в хранилище нет валидного числа — инициализируем и выходим
    if (!raw || isNaN(lastSavedTime)) {
        lastSavedTime = 0;
    }

    // дальше — обычная логика
    if (currentTime > lastSavedTime) {
        await CommonHelper.sendTelegramMessage(
            'Травма увеличилась! Теперь травма: ' + CommonHelper.getTraumaTime(),
            'common'
        );
    }

    await CommonHelper.setExtStorage('wor_fight_last_trauma_minutes', currentTime);
}

async function parsing() {
    let isChecking = false;

    async function checkPage() {
        if (isChecking) {
            CommonHelper.log('[Parser] Проверка уже запущена, пропуск...', false);
            return;
        }

        isChecking = true;

        try {
            CommonHelper.log('[Parser] Начинаем проверку...');
            const urls = await CommonHelper.getExtStorage('wor_parsing_links') || [];
            const targets = await CommonHelper.getExtStorage('wor_parsing_targets') || [];
            const invert = await CommonHelper.getExtStorage('wor_parsing_invert_search_active') || false;
            let i = 1;

            const data = urls.map(link => ({
                type: 'Ссылка ' + i++,
                textToFind: targets,
                url: link
            }));

            for (const item of data) {
                await CommonHelper.delay(1000, 2000);
                CommonHelper.log(`[Parser] Проверка ${item.type}...`);
                await CommonHelper.parsingPage(item.url, item.textToFind, item.type, invert);
            }

            CommonHelper.log('[Parser] Проверка завершена.', false);

        } catch (error) {
            CommonHelper.log('[Parser] Ошибка при проверке:' + JSON.stringify(error));
        } finally {
            isChecking = false;
        }
    }

    async function scheduleNextCheck(baseInterval) {
        const nextDelay = CommonHelper.getRandomNumber(baseInterval, baseInterval + 10000);
        await CommonHelper.log(`[Parser] Следующая проверка через ${nextDelay / 1000} секунд...`, false);

        setTimeout(async () => {
            const stillActive = await CommonHelper.getExtStorage('wor_parsing_active');
            if (stillActive) {
                await checkPage();
                await scheduleNextCheck(baseInterval); // рекурсивно запускаем следующее ожидание
            } else {
                await CommonHelper.log('[Parser] Остановлено пользователем.', false);
            }
        }, nextDelay);
    }

    const rawTimeout = await CommonHelper.getExtStorage('wor_parsing_timeout');
    const baseInterval = rawTimeout ? parseInt(rawTimeout, 10) * 1000 : 30000;

    await checkPage(); // первый запуск
    await scheduleNextCheck(baseInterval); // дальше уже по таймауту
};

async function setTitle() {
    let title = document.querySelector('.menu')?.textContent;

    if (title) {
        document.title = title;
    }
}
async function checkFlashNotifications() {
    await CommonHelper.setExtStorage('wor_chat_flash_notifications', []);

    let html = document.querySelector('.header_mes');

    if (!html) {
        return;
    }

    const text = html.innerText;

    if (text.includes('Для того, чтобы ловить рыбу, Вам необходима удочка!')) {
        await CommonHelper.turnFishing(false);
        await CommonHelper.turnFighting(false);
        CommonHelper.sendTelegramMessage('Для того, чтобы ловить рыбу, Вам необходима удочка!', 'common', true, 'html', 60);
    }

    if (text.includes('Скрыть сообщение')) {
        const isBattle = text.includes('Тактическое сражение') || text.includes('Боевое сражение');
        const hasReward = text.includes('колеса фортуны') || text.includes('1 рубину') || text.includes('5000');

        if (!isBattle || hasReward) {
            CommonHelper.sendTelegramMessage(html.innerText, 'common', true, 'html', 1200);
        }
    }

    // Парсим flash-уведомления новым парсером (результат сохраняется в storage для возможного будущего использования)
    let messages = Chat.getParsedMessagesNew(html);

    await CommonHelper.setExtStorage('wor_chat_flash_notifications', messages);
}

function backgroundListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        CommonHelper.log("Получено сообщение в process-common.js: " + message.type);

        if (message.type === "getChatMessages") {
            (async () => {
                try {
                    let chatUrl = document.querySelector('a[href*=chat2]')?.href;

                    if (!chatUrl) {
                        CommonHelper.log('Нету ссылки на чат');
                        sendResponse({ error: 'Chat URL not found' });
                        return;
                    }

                    let result = await fetch(chatUrl);
                    let html = await result.text();

                    let parser = new DOMParser();
                    let htmlPage = parser.parseFromString(html, 'text/html');
                    let msgBox = htmlPage.querySelector('#msg_box');

                    // Получаем ник игрока для корректного определения поля isForMe в каждом сообщении
                    const playerName = await CommonHelper.getExtStorage('wor_chat_player_name');
                    let formattedMessages = Chat.getParsedMessagesNew(msgBox, playerName);

                    processActualMessages(formattedMessages);

                    sendResponse({ formattedMessages });
                } catch (err) {
                    CommonHelper.log('Ошибка при получении сообщений чата: + ', JSON.stringify(err));
                    sendResponse({ error: err.toString() });
                }
            })();

            return true;
        }

        if (message.type === 'fetchModeratorsList') {
            (async () => {
                try {
                    const response = await fetch(message.url);
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const links = doc.querySelectorAll('.table_modern tr td a');
                    const names = Array.from(links).map(a => a.textContent.trim());
                    sendResponse({ names });
                } catch (err) {
                    sendResponse({ error: err.toString() });
                }
            })();
            return true;
        }

        if (message.type === 'sendDirectMessage') {
            (async () => {
                try {
                    const response = await fetch('/wap/otpravit.php?js=1', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            privat: message.isPrivate ? 'true' : 'false',
                            komy: message.to,
                            message: message.answer
                        })
                    });
                    sendResponse({ status: response.status });
                } catch (err) {
                    sendResponse({ error: err.toString() });
                }
            })();
            return true;
        }

        if (message.type === 'disableChaosBattle') {
            (async () => {
                try {
                    // Получаем сохранённую дату
                    let lastCheck = await CommonHelper.getExtStorage('wor_options_last_chaos_check'); // формат: YYYY-MM-DD

                    // Текущая дата в том же формате
                    const today = new Date();
                    const currentDateStr = new Date().toISOString().split('T')[0];

                    // Сравнение
                    if (lastCheck === currentDateStr) {
                        // Уже была проверка сегодня
                        sendResponse({ success: true });
                    } else {
                        // Не было - устанавливаем сегодняшнюю дату
                        await CommonHelper.setExtStorage('wor_options_last_chaos_check', currentDateStr);
                    }

                    // Создаём скрытый iframe
                    const iframe = document.createElement('iframe');
                    iframe.style.display = 'none';
                    iframe.src = '/wap/options.php';
                    document.body.appendChild(iframe);

                    // Ждём загрузки iframe
                    iframe.onload = () => {
                        try {
                            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

                            // Ищем select и устанавливаем значение
                            const select = iframeDoc.querySelector('select[name="likexaos"]');
                            if (select && select.value === '0') {
                                select.value = "1";

                                // Найти форму и отправить её
                                const form = select.closest('form');
                                if (form) {
                                    form.submit();
                                } else {
                                    throw new Error("Форма не найдена");
                                }
                            }

                            // Удаляем iframe после отправки (опционально, можно оставить)
                            setTimeout(() => iframe.remove(), 3000);

                            sendResponse({ success: true });
                        } catch (innerErr) {
                            sendResponse({ error: innerErr.toString() });
                        }
                    };

                } catch (err) {
                    sendResponse({ error: err.toString() });
                }
            })();

            return true; // важно для асинхронного sendResponse
        }

    });
}

async function processActualMessages(messages) {
    await processPrimanka(messages);
}

async function processPrimanka(messages) {
    try {
        const isNeed = await CommonHelper.getExtStorage('wor_fight_activate_primanka');
        if (!isNeed) return;

        if (document.location.href.includes('cap') || document.location.href.includes('primanka')) {
            return;
        }

        for (const msg of messages) {
            // getParsedMessagesNew возвращает type в верхнем регистре: 'SYSTEM', 'PUBLIC', 'PUBLIC_TO', 'PRIVATE'
            if (msg.type !== 'SYSTEM') continue;

            if (msg.text.includes('Приманка активирована!')) {
                CommonHelper.log('Приманка ещё активна');
                return;
            }

            if (msg.text.includes('Приманки осталось на')) {
                const regex = /Приманки осталось на\s*(\d+)\s*раз/i;
                const match = msg.text.match(regex);

                if (match) {
                    const remaining = Number(match[1]);
                    CommonHelper.log('До активации приманки еще ' + remaining + ' нападений');
                } else {
                    CommonHelper.log("Не удалось найти число приманок");
                }

                return;
            }

            if (msg.text.includes('Приманка закончилась')) {
                const response = await fetch('/wap/teritory.php?uni=1746025807&hash=713bc86');

                if (!response.ok) {
                    await CommonHelper.sendTelegramMessage(
                        `Ошибка загрузки страницы Природы для приманки: ${response.status}`
                    );
                    return;
                }

                if (!response.url.includes('teritory')) {
                    CommonHelper.log('Запрос приманки вернул другую страницу, не Природу. Попробуем позже.');
                    return;
                }

                const html = await response.text();
                const parser = new DOMParser();
                const newDoc = parser.parseFromString(html, 'text/html');

                if (!html.includes('Мини-карта')) {
                    return;
                }

                CommonHelper.log("Ищем кнопку активации приманки");
                const activateSpan = Array.from(newDoc.querySelectorAll('span'))
                    .find(s => s.textContent.includes('подкинуть новую приманку'));

                if (activateSpan) {
                    const link = activateSpan.closest('a');
                    if (link && link.href) {
                        CommonHelper.log('Активируем приманку, переходим по ссылке');
                        await CommonHelper.delay(CommonHelper.SMALL_MID_RANDOM);
                        window.location.href = link.href;
                    } else {
                        CommonHelper.log('Нашли span, но не смогли получить <a>');
                    }
                } else {
                    CommonHelper.log('Не нашли кнопку для активации приманки');
                    CommonHelper.log(html);
                    await CommonHelper.sendTelegramMessage('Проблема с включением приманки — нет кнопки Активации приманки');
                }

                return;
            }
        }
    } catch (e) {
        CommonHelper.log('Ошибка в processPrimanka: ' + e.message);
        await CommonHelper.sendTelegramMessage('Ошибка при обработке приманки: ' + e.stack);
    }
}

async function sendRandomFact() {
    try {
        CommonHelper.log("Запрашиваем случайный факт...");

        // Запрашиваем случайный факт
        let res = await fetch("http://numbersapi.com/random/trivia");

        if (res.status !== 200) {
            // Если статус ответа не 200, прекращаем выполнение
            CommonHelper.log("Ошибка: не удалось получить данные");
            return;
        }

        let factText = await res.text();
        // Переводим факт
        let translateUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(factText)}&langpair=en|ru`;
        let translatedText = await fetch(translateUrl).then(res => res.json()).then(data => data.responseData.translatedText);

        CommonHelper.log("Получен факт: " + translatedText);

        if (translatedText.includes('MYMEMORY WARNING')) {
            CommonHelper.log("Получена ошибка, выходим");
            return;
        }

        let waitTime = CommonHelper.getRandomNumber(120000, 300000); // Генерируем случайное время ожидания (60-90 сек)
        CommonHelper.log(`Ожидание ${Math.floor(waitTime / 1000)} секунд перед публикацией...`);

        // Таймер обратного отсчёта
        let remainingTime = Math.floor(waitTime / 1000);
        let timer = setInterval(() => {
            remainingTime--;
            CommonHelper.log(`Осталось ${remainingTime} секунд...`, true, 0, false);
            if (remainingTime <= 0) clearInterval(timer);
        }, 1000);

        // Ждём перед отправкой
        await new Promise(resolve => setTimeout(resolve, waitTime));

        CommonHelper.log("Готовимся к отправке сообщения...");

        // Поиск формы
        let form = document.querySelector('form');
        if (!form) return CommonHelper.log("Форма не найдена!");

        // Поиск текстового поля
        let inputField = form.querySelector('textarea[name="textmes"]');
        if (!inputField) return CommonHelper.log("Поле ввода не найдено!");

        // Вставляем сообщение
        inputField.value = translatedText;

        // Отправляем форму
        let submitButton = form.querySelector('input[type="submit"]');
        if (submitButton) {
            CommonHelper.log("Сообщение отправлено!");
            submitButton.click();
        } else {
            CommonHelper.log("Кнопка отправки не найдена!");
        }

    } catch (error) {
        CommonHelper.log("Ошибка:" + JSON.stringify(error));
    }
}
