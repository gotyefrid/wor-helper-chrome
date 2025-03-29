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
    let backgroud = document.querySelector('img[src^="captcha_main.php"]');

    // ✅ Берем картинку прямо из браузера без запроса
    let firstImageFile = await getImageFromDOM(backgroud, "first.png");

    if (!firstImageFile) {
        return;
    }

    downloadFile(firstImageFile);

    log('Скачали картинку');
    let reqs;

    try {
        reqs = await getCaptchaRequirements(firstImageFile);
        log('Искомые координаты:' + JSON.stringify(reqs));
    } catch (e) {
        log(e.message);
    }


    if (reqs && reqs.x && reqs.y) {
        log('Обнуляем счетчик попыток счетчик', false);
        localStorage.setItem('captchaShuffleCount', 1);

        const piece = document.querySelector("#puzzle-piece");

        if (piece) {
            piece.style.left = `${reqs.x}px`;
            piece.style.top = `${reqs.y}px`;

            log('Передвинули картинку');
            await delay(getRandomNumber(500, 1000));
            log('Жмём подтвердить');
            document.querySelector(`input[type=submit]`).click();
            return;
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

function downloadFile(file) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name || "download.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    let detectFormData = new FormData();
    detectFormData.append("file", firstImageFile);

    let detectResponse = await fetch(CAPTCHA_HOST + "/detect_puzzle", {
        method: "POST",
        body: detectFormData
    });

    if (!detectResponse.ok) throw new Error("Ошибка при запросе detect_puzzle");
    let detectResult = await detectResponse.json();
    return detectResult;
}
