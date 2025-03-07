processCapcha();

async function processCapcha() {
    let access = await chrome.storage.local.get(["wor_captcha_active"]);

    if (!access.wor_captcha_active) {
        log('Обход капчи не активен.');
        return;
    }

    log('Отправляем капчу для распознания в нейросеть');
    await delay(getRandomNumber(3000, 10000));
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
        let img = document.querySelector(`img[src*=${check.matching_image}]`)

        if (img) {
            img.click();
            log('Выбрали нужную картинку');
            await delay(getRandomNumber(1000, 2000));
            log('Подтверждаем');
            await delay(getRandomNumber(1000, 2000));
            document.querySelector(`input[type=submit]`).click();
        }
    } else {
        throw new Error("matching_image не найден");
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

        let matchResponse = await fetch("http://localhost:8585/find_matching_image", {
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

        let detectResponse = await fetch("http://localhost:8585/detect_numbers", {
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
