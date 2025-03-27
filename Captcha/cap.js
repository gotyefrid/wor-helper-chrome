const CAPTCHA_HOST = localStorage.getItem('captcha_host');

window.addEventListener("load", function () {
    processCapcha();
});


async function processCapcha() {
    await CommonHelper.delay(1000);
    let access = await chrome.storage.local.get(["wor_captcha_active"]);

    document.title = 'Капча';

    if (!access.wor_captcha_active) {
        log('Обход капчи не активен.');
        return;
    }

    log('Отправляем капчу для распознания в нейросеть');
    // 📌 Использование
    let firstImageElement = document.querySelector('img[src^="captcha.php"]');
    let otherImageElements = Array.from(document.querySelectorAll('img[src^="captcha_users.php"]'));

    // ✅ Берем картинку прямо из браузера без запроса
    let firstImageFile = await getImageFromDOM(firstImageElement, "first.jpg");

    // ✅ Берем остальные 10 картинок
    let otherImageFiles = await Promise.all(
        otherImageElements.map(async (img) => {
            let kParam = getParamFromUrl(img.src, "k"); // Получаем "k" из URL
            let filename = kParam ? `${kParam}` : "unknown"; // Формируем имя файла
            return getImageFromDOM(img, filename);
        })
    );

    let reqs = await getCaptchaRequirements(firstImageFile);
    log('Количество мужчин и женищин соотвественно равно:' + JSON.stringify(reqs));
    let check = await checkRigthImage(otherImageFiles, reqs);
    log('Получили id нужной картинки:' + JSON.stringify(check.matching_image));

    if (check.matching_image !== false) {
        log('Обнуляем счетчик попыток счетчик', false);
        localStorage.setItem('captchaShuffleCount', 1);
        let img = document.querySelector(`img[src*=${check.matching_image}]`)

        if (img) {
            img.click();
            log('Выбрали нужную картинку');
            await delay(getRandomNumber(500, 1000));
            log('Подтверждаем');
            document.querySelector(`input[type=submit]`).click();
        }
    } else {
        log('Не удалось найти правильный вариант');
        await delay(2000);

        let count = localStorage.getItem('captchaShuffleCount') ?? 1;
        log('Текущая попытка:' + count);
        await delay(2000);

        if (count <= 2) {
            log('Перемешиваем картинки для новой попытки');
            await delay(2000);

            log('Устанавливаем счетчик', false);
            await delay(2000);
            localStorage.setItem('captchaShuffleCount', ++count)
            // надо нажать на регенерацию капчи
            document.querySelector('a[href*=shuffle]').click();
            return;
        }

        log('Перебор попыток. Останавливаем прохождение до лучших времён');
        await chrome.storage.local.set({ ['wor_chemistry_active']: false });
        await chrome.storage.local.set({ ['wor_fishing_active']: false });
        document.location = '/wap/teleport.php';
        return;
    }

}

function getImageFromDOM(imgElement, filename = "image.jpg") {
    try {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");

        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;

        ctx.drawImage(imgElement, 0, 0);

        return new Promise(resolve => {
            canvas.toBlob(blob => {
                resolve(new File([blob], filename, { type: blob.type }));
            }, "image/png"); // Можно менять формат (png, jpeg)
        });
    } catch (error) {
        console.error("Ошибка получения изображения из DOM:", error);
        return null;
    }
}

function getParamFromUrl(url, param) {
    let urlObj = new URL(url, window.location.origin);
    return urlObj.searchParams.get(param);
}

async function checkRigthImage(otherImageFiles, detectResult) {
    try {
        let matchFormData = new FormData();
        otherImageFiles.forEach(file => matchFormData.append("files", file));
        matchFormData.append("expected", JSON.stringify(detectResult));

        let matchResponse = await fetch(CAPTCHA_HOST + "/find_matching_image", {
            method: "POST",
            body: matchFormData
        });

        // Проверяем статус ответа
        if (!matchResponse.ok) {
            let errorText = await matchResponse.text(); // Получаем тело ответа
            throw new Error(`Ошибка find_matching_image (код ${matchResponse.status}): ${errorText}`);
        }

        let matchResult = await matchResponse.json();
        return matchResult;
    } catch (error) {
        console.error("🚨 Ошибка:", error.message);
    }
}

async function getCaptchaRequirements(firstImageFile) {
    try {
        let detectFormData = new FormData();
        detectFormData.append("image", firstImageFile);

        let detectResponse = await fetch(CAPTCHA_HOST + "/detect_numbers", {
            method: "POST",
            body: detectFormData
        });

        if (!detectResponse.ok) throw new Error("Ошибка при запросе detect_numbers");
        let detectResult = await detectResponse.json();
        return detectResult;
    } catch (error) {
        console.error("🚨 Ошибка:", error.message);
        throw new Error("Ошибка при запросе detect_numbers")
    }
}
