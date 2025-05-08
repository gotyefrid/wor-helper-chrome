
window.addEventListener("load", async function () {
    let access = await CommonHelper.getExtStorage('wor_captcha_active');

    if (!access) {
        CommonHelper.log('Обход капчи не активен.');
        let exitUrl = await CommonHelper.getFightExitUrl() || null;

        if (exitUrl) {
            CommonHelper.sendTelegramMessage('Нужно пройти капчу: ' + exitUrl);
            await CommonHelper.delay(15000);
            document.location = exitUrl;
            return;
        }
        CommonHelper.sendTelegramMessage('Нужно пройти капчу: ' + document.location.href);

        await CommonHelper.delay(15000);
        CommonHelper.reloadPage();
        return;
    }

    let urlType = document.location.href.includes('cap') ? 'cap' : 'primanka';
    let canResolve = await checkTimeout(urlType);

    if (!canResolve) {
        CommonHelper.sendTelegramMessage(`Капча "${urlType}" вылезла раньше чем 8 минут`);
        return;
    }

    let captcha = new Captcha();

    if (captcha.lastTryWasWrong()) {
        await CommonHelper.delay(CommonHelper.MEDIUM_RANDOM);
        let currentErrorCount = await CommonHelper.getExtStorage('wor_captcha_error_count') || 0; // либо получить значение - либо 0

        if (currentErrorCount > 2) {
            CommonHelper.sendTelegramMessage('Не получается пройти капчу! Срочно нужно вмешательство!', 'common', true, 'html', 180);
            return;
        }

        CommonHelper.sendTelegramMessage('Неправильно поставлен пазл! Запрашиваем новую картинку!', 'common', true, 'html');
        await CommonHelper.setExtStorage('wor_captcha_error_count', ++currentErrorCount);

        // Обновляем картинку
        document.querySelector('a[href*=shuffle]').click();

        return;
    }

    let actualCacheAllResourses = await captcha.hashAllResources();

    if (!actualCacheAllResourses) {
        CommonHelper.sendTelegramMessage('Не получили хэш всех ресурсов. Ничего не делаем.');
        return;
    }

    // бегающий скрипт
    let hpScript = [...document.querySelectorAll('script')].find(el => el.innerText.includes('updateBars'));

    if (hpScript) {
        function removeDynamicValues(scriptText) {
            return scriptText
                // Заменяет большие числа-подобные значения (например, временные метки в мс)
                .replace(/\b1\d{12,}\b/g, 'TIMESTAMP')
                // Заменяет другие числовые литералы
                .replace(/\b\d+(\.\d+)?\b/g, 'NUMBER');
        }

        let cleanedScript = removeDynamicValues(hpScript.innerText);
        cleanedScript = cleanedScript.replace(/\s+/g, '');
        cleanedScript = cleanedScript.replace('.TIMESTAMP', '');

        if (captcha.fnv1aHash(cleanedScript) !== 3842083230) {
            CommonHelper.log(cleanedScript);
            CommonHelper.log('Хэш плавающего скрипта изменился! Ничего не делаем');
            CommonHelper.sendTelegramMessage('Хэш плавающего скрипта изменился! Ничего не делаем');
            CommonHelper.sendTelegramMessage(cleanedScript);
            return;
        }
    }

    let cleanedHtml = captcha.cleanDocumentHTML();
    // console.log(cleanedHtml);
    let actualHtmlHash = captcha.fnv1aHash(cleanedHtml);
    CommonHelper.log('Актуал хэш страницы:' + actualHtmlHash);
    CommonHelper.log('Актуал хэш ресурсов:' + actualCacheAllResourses);

    if (actualHtmlHash !== captcha.HTML_HASH) {
        CommonHelper.log(cleanedHtml);
        CommonHelper.log('Хэш HTML изменился! Ничего не делаем');
        CommonHelper.sendTelegramMessage('Хэш HTML изменился! Ничего не делаем');
        return;
    }

    if (actualCacheAllResourses !== captcha.RESOURCES_HASH) {
        CommonHelper.log('Хэш ресурсов изменился! Ничего не делаем');
        CommonHelper.sendTelegramMessage('Хэш ресурсов изменился! Ничего не делаем');
        return;
    }

    CommonHelper.log('Хэш одинаковый - можно проходить капчу, ничгео не изменилось');

    let imgElement = this.document.querySelector('img[src*=captcha_main]');

    if (imgElement) {
        let image = await captcha.getImageFromDOM(imgElement);
        let coords = await captcha.getCoorditanes(image)

        if (coords && coords.x != null && coords.y != null) {
            let randomOffset = 10;
            let piece = document.getElementById("puzzle-piece");
            // await captcha.simulateArcDrag(piece, coords, 8, randomOffset);
            captcha.setPuzzleCoorsinates(piece, coords.x, coords.y, randomOffset);

            // Проверка что пазл установлен нормально на нужном месте.
            const actualX = piece.offsetLeft;
            const actualY = piece.offsetTop;

            const dx = Math.abs(actualX - coords.x);
            const dy = Math.abs(actualY - coords.y);

            if (dx > randomOffset || dy > randomOffset) {
                CommonHelper.sendTelegramMessage('🛑 Пазл не достиг цели');
                CommonHelper.log('🛑 Пазл не достиг цели');
                await CommonHelper.delay(CommonHelper.MEDIUM_RANDOM);
                CommonHelper.reloadPage();
            } else {
                // ✅ Всё ок
                CommonHelper.log("✅ Пазл на месте");

                // Попытаемся достать предыдущие времена или получить пустой объект
                const lastTime = (await CommonHelper.getExtStorage('wor_captcha_last_solve_time')) || {};
                // Записываем «сейчас» под нужным ключом
                lastTime[urlType] = Date.now();
                // Сохраняем обратно
                await CommonHelper.setExtStorage('wor_captcha_last_solve_time', lastTime);

                await CommonHelper.setExtStorage('wor_captcha_error_count', 0);
                await CommonHelper.delay(1000, 10000);

                CommonHelper.clickAndWait(document.querySelector('input[type=submit]'));
                return;
                let exitUrl = await CommonHelper.getFightExitUrl() || null;

                // if (exitUrl) {
                //     CommonHelper.sendTelegramMessage('Нужно пройти капчу: ' + exitUrl);
                //     await CommonHelper.delay(15000);
                //     // document.location = exitUrl;
                //     return;
                // }

                // await CommonHelper.delay(15000);
            }
        } else {
            CommonHelper.sendTelegramMessage("⚠️ Не переданы координаты для перемещения!");
        }
    }
});


async function checkTimeout(type) {
    // Получаем { cap: timestamp, primanka: timestamp } или пустой объект
    const lastSolveTime = await CommonHelper.getExtStorage('wor_captcha_last_solve_time') || {};
    const now = Date.now();
    const eightMinutes = 8 * 60 * 1000;

    // Проверяем, есть ли в объекте свойство с именем type
    if (lastSolveTime[type]) {
        const delta = now - lastSolveTime[type];
        if (delta < eightMinutes) {
            CommonHelper.log(
                `С момента последней капчи "${type}" прошло ${Math.floor(delta / 1000)} секунд (< 8 мин)`
            );
            return false;
        }
    } else {
        CommonHelper.log(`Капча "${type}" ещё не решалась — первый заход`);
    }

    // Если сюда дошли — либо прошло ≥8 минут, либо свойства нет
    CommonHelper.log(`Можно решать капчу "${type}" снова`);

    return true;
}