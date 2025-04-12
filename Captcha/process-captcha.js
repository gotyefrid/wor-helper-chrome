
window.addEventListener("load", async function () {
    let access = await CommonHelper.getExtStorage('wor_captcha_active');

    if (!access) {
        CommonHelper.log('Обход капчи не активен.');
        let exitUrl = await CommonHelper.getExtStorage('wor_fight_exit_url') || null;

        if (exitUrl) {
            CommonHelper.sendTelegramMessage('Нужно пройти капчу: ' + exitUrl);
            await CommonHelper.delay(15000);
            document.location = exitUrl;
            return;
        }
        CommonHelper.sendTelegramMessage('Нужно пройти капчу: ' + document.locatio.href);

        await CommonHelper.delay(15000);
        CommonHelper.reloadPage();
        return;
    }

    let captcha = new Captcha();

    if (captcha.lastTryWasWrong()) {
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
        if (captcha.fnv1aHash(cleanedScript) !== 3261414982) {
            CommonHelper.log('Хэш плавающего скрипта изменился! Ничего не делаем');
            CommonHelper.sendTelegramMessage('Хэш плавающего скрипта изменился! Ничего не делаем');
            return;
        }
    }

    let cleanedHtml = captcha.cleanDocumentHTML();
    // console.log(cleanedHtml);
    let actualHtmlHash = captcha.fnv1aHash(cleanedHtml);
    CommonHelper.log('Актуал хэш страницы:' + actualHtmlHash);
    CommonHelper.log('Актуал хэш ресурсов:' + actualCacheAllResourses);
    console.log(cleanedHtml);

    if (actualHtmlHash !== captcha.HTML_HASH) {
        CommonHelper.log('Хэш HTML изменился! Ничего не делаем');
        console.log(cleanedHtml);
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
                await CommonHelper.delay(2000);
                CommonHelper.reloadPage();
            } else {
                // ✅ Всё ок
                CommonHelper.log("✅ Пазл на месте");
                await CommonHelper.setExtStorage('wor_captcha_error_count', 0);
                await CommonHelper.delay(CommonHelper.getRandomNumber(3000, 15000));

                CommonHelper.clickAndWait(document.querySelector('input[type=submit]'));
                return;
                // let exitUrl = await CommonHelper.getExtStorage('wor_fight_exit_url') || null;

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