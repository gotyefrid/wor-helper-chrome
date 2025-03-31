class Captcha {
    CAPTCHA_HOST = CommonHelper.getExtStorage('wor_captcha_host');
    CURRENT_SCRIPT_HASH = 'e1cmw3e1cm';

    constructor() {
        this.#checkCurrentPage();
    }

    #checkCurrentPage() {
        const paths = ["/wap/cap"];

        // Определяем, является ли текущая страница страницей капчи
        this.isCaptchaPage = paths.some(path => window.location.pathname.includes(path));
    }

    async getCoorditanes() {
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

    getImageFromDOM(imgElement, filename = "image.jpg") {
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

    simpleHash(str, length = 10) {
        let hash = 0;

        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0; // Приведение к 32-битному целому
        }

        // Преобразуем в положительное число и в base36 (буквы + цифры)
        const base = Math.abs(hash).toString(36);

        // Повторим строку, если короткая, и обрежем до нужной длины
        return base.repeat(Math.ceil(length / base.length)).slice(0, length);
    }

}