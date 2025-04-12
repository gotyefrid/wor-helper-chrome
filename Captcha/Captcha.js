class Captcha {
    HTML_HASH = 1942182699;
    RESOURCES_HASH = 2039952467;

    constructor() {
        this.#checkCurrentPage();
    }

    #checkCurrentPage() {
        const paths = ["/wap/cap"];

        // Определяем, является ли текущая страница страницей капчи
        this.isCaptchaPage = paths.some(path => window.location.pathname.includes(path));
    }

    lastTryWasWrong() {
        let html = document.querySelector('.header_mes');

        if (!html) {
            return false;
        }

        if (html.innerText.includes('Неправильно поставлен пазл!')) {
            return true;
        }

        return false;
    }

    async getCoorditanes(image) {
        const CAPTCHA_HOST = await CommonHelper.getExtStorage('wor_captcha_host');
        let detectFormData = new FormData();
        detectFormData.append("file", image);

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

    fnv1aHash(str) {
        const prime = 0x811C9DC5;
        let hash = prime;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
        }
        return hash >>> 0;
    }

    async hashAllResources() {
        const urls = [];

        // Собираем все <script src="">
        document.querySelectorAll('script[src]').forEach(el => urls.push(el.src));

        // Собираем все <link rel="stylesheet" href="">
        document.querySelectorAll('link[rel="stylesheet"][href]').forEach(el => urls.push(el.href));

        const partialHashes = [];

        for (const url of urls) {
            try {
                const res = await fetch(url);
                const text = await res.text();
                const hash = this.fnv1aHash(text);
                partialHashes.push(hash.toString());
            } catch (e) {
                CommonHelper.log(`Не удалось загрузить: ${url}` + JSON.stringify(e));
                return false;
            }
        }

        const combined = partialHashes.join("|");
        return this.fnv1aHash(combined);
    }

    cleanDocumentHTML() {
        // Клонируем весь документ, чтобы не трогать оригинал
        const clone = document.documentElement.cloneNode(true);

        // Удаляем все элементы внутри динамических блоков кроме скриптов
        clone.querySelectorAll('.chat, .menu, .contur_mes').forEach(el => {
            [...el.childNodes].forEach(child => {
                if (child.nodeType !== Node.ELEMENT_NODE || child.tagName !== 'SCRIPT') {
                    el.removeChild(child);
                }
            });

            // Если после очистки остался пустым — удаляем сам элемент
            const hasScript = el.querySelector('script') !== null;
            const hasText = el.textContent.trim().length > 0;
            const hasOtherElements = [...el.children].some(child => child.tagName !== 'SCRIPT');

            if (!hasScript && !hasText && !hasOtherElements) {
                el.remove();
            }
        });

        // лично моя фигня из расширения другого
        [...clone.querySelectorAll('style')]
            .filter(el => el.innerText.includes('clockify'))
            .forEach(el => el.remove());

        // бегающий скрипт (если хп не полное он появляется)
        [...clone.querySelectorAll('script')].find(el => el.innerText.includes('updateBars'))?.remove();

        // Получаем HTML-код без динамических элементов
        let htmlWithoutChat = clone.outerHTML;

        // Удаляем значения uni=... и hash=... (оставляя только uni= и hash=)
        htmlWithoutChat = htmlWithoutChat.replace(/uni=[^&"' ]*/g, 'uni=');
        htmlWithoutChat = htmlWithoutChat.replace(/hash=[^&"' ]*/g, 'hash=');

        // Удаляем все пробелы, табы и переносы строк
        const cleanedHTML = htmlWithoutChat.replace(/\s+/g, '');

        // console.log(cleanedHTML);
        return cleanedHTML;
    }


    async simulateArcDrag(el, end, baseInterval = 8, randomOffset = 10) {
        return new Promise((resolve) => {
            const start = { x: 0, y: 0 };
            el.style.left = "0px";
            el.style.top = "0px";
            el.style.position = "absolute";

            const offsetX = (Math.random() - 0.5) * 2 * randomOffset;
            const offsetY = (Math.random() - 0.5) * 2 * randomOffset;
            const finalTarget = {
                x: end.x + offsetX,
                y: end.y + offsetY
            };

            const arcRadius = 10 + Math.random() * 20;
            const arcDirection = Math.random() < 0.5 ? 1 : -1;

            const totalDistance = Math.hypot(finalTarget.x, finalTarget.y);
            const baseSteps = totalDistance / 3;
            const speedFactor = 8 / baseInterval;
            const intervalAdjustment = Math.pow(speedFactor, 0.6);
            let steps = Math.round(baseSteps * 1.3 * intervalAdjustment);

            const minSteps = 70 + Math.floor(Math.random() * 31);
            steps = Math.max(steps, minSteps);

            let currentStep = 0;

            function easeOutQuart(t) {
                return 1 - Math.pow(1 - t, 4);
            }

            el.dispatchEvent(new MouseEvent("mousedown", {
                bubbles: true,
                clientX: start.x,
                clientY: start.y
            }));

            function nextStep() {
                currentStep++;
                const linearT = Math.min(currentStep / steps, 1);
                const t = easeOutQuart(linearT);
                const angle = linearT * Math.PI;

                const dx = finalTarget.x - start.x;
                const dy = finalTarget.y - start.y;

                const progressX = start.x + dx * t;
                const progressY = start.y + dy * t;

                const perp = { x: -dy, y: dx };
                const len = Math.hypot(perp.x, perp.y);
                const norm = { x: perp.x / len, y: perp.y / len };

                const arcOffset = Math.sin(angle) * arcRadius * arcDirection;

                const x = progressX + norm.x * arcOffset;
                const y = progressY + norm.y * arcOffset;

                document.dispatchEvent(new MouseEvent("mousemove", {
                    bubbles: true,
                    clientX: x,
                    clientY: y
                }));

                if (linearT >= 1) {
                    document.dispatchEvent(new MouseEvent("mouseup", {
                        bubbles: true,
                        clientX: x,
                        clientY: y
                    }));
                    resolve(); // ✅ Сообщаем, что всё завершилось
                } else {
                    const jitter = baseInterval * (0.8 + Math.random() * 0.4);
                    setTimeout(nextStep, jitter);
                }
            }

            nextStep();
        });
    }

    setPuzzleCoorsinates(el, x, y, randomOffset = 10) {
        const offsetX = (Math.random() - 0.5) * 2 * randomOffset;
        const offsetY = (Math.random() - 0.5) * 2 * randomOffset;

        el.style.left = `${x + offsetX}px`;
        el.style.top = `${y + offsetY}px`;
    }
}