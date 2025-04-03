(async function () {

    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    setTitle();
    checkFlashNotifications();
    
    const isParsingActive = await CommonHelper.getExtStorage('wor_parsing_active');
    if (isParsingActive) {
        parsing();
    };
})();

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
                await CommonHelper.delay(CommonHelper.getRandomNumber(1000, 2000));
                CommonHelper.log(`[Parser] Проверка ${item.type}...`);
                await CommonHelper.parsingPage(item.url, item.textToFind, item.type, invert);
            }

            CommonHelper.log('[Parser] Проверка завершена.', false);

        } catch (error) {
            console.error('[Parser] Ошибка при проверке:', error);
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

    if (html.innerText.includes('Награда:')) {
        CommonHelper.sendTelegramMessage(html.innerText, 'common', true, 'html');
    }

    let messages = Chat.getParsedMessages(html);

    await CommonHelper.setExtStorage('wor_chat_flash_notifications', messages);
}

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
                let formattedMessages = Chat.getParsedMessages(msgBox);

                sendResponse({ formattedMessages });
            } catch (err) {
                CommonHelper.log('Ошибка при получении сообщений чата: + ', JSON.stringify(err));
                sendResponse({ error: err.toString() });
            }
        })();

        return true;
    }

    if (message.action === "mergeContent") {
        CommonHelper.log("Вызываем mergeContent()");
        mergeContent();
        sendResponse({ success: true });
    }
});


