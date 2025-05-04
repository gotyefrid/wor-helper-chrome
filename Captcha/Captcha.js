class Captcha {
    // <html><head><metaname="viewport"content="width=device-width,initial-scale=1"><metaname="keywords"content="онлайнигра,RPG,WOR,WorldOfRest,рпгигра,браузернаямобильнаяигра,рпгдляандроид"><metahttp-equiv="Content-Type"content="text/html;charset=utf-8"><metahttp-equiv="refresh"content="200"><title>WoR:Проверка</title><linkrel="stylesheet"type="text/css"href="style54.css?v=20250019"><scripttype="text/javascript"src="/jquery-3.7.1.min.js"></script></head><body><style>#captcha-container{position:relative;width:300px;height:200px;border:1pxsolid#ccc;margin:10px;background:#eee;}#captcha-containerimg{display:block;}#puzzle-piece{position:absolute;width:50px;height:50px;cursor:move;top:0;left:0;z-index:10;}.button{display:block;margin:10px;}</style><divclass="cont"><divclass="menu_div"align="left"><ul><li><ahref="main.php?uni=&amp;hash="><imgsrc="icons/glavnoe_menyu.gif"border="0"style="vertical-align:middle"width="30"height="30"alt="">Главноеменю</a></li></ul></div></div><divstyle="margin:10px">Перетянитепазлпримернонаегоместо:</div><divid="captcha-container"><imgsrc="captcha_main.php?uni=&amp;hash="width="300"height="200"alt=""><imgsrc="images/cap_puzzle.png"id="puzzle-piece"alt=""class="ui-draggableui-draggable-handle"></div><formaction="cap.php?enter&amp;uni=&amp;hash="method="post"id="captcha-form"><inputtype="hidden"name="piece_x"id="piece_x"value=""><inputtype="hidden"name="piece_y"id="piece_y"value=""><inputtype="submit"value="Готово"class="button"></form><divstyle="margin:10px"><br><br><aclass="btninv"href="cap.php?shuffle=1&amp;uni=&amp;hash=">Сменитькартинку</a><br><spanstyle="font-size:10px">разрешаетсянеболее10развчас</span></div><scriptsrc="/jquery-ui.min.js?v001"></script><scriptsrc="/jquery.ui.touch-punch.min.js"></script><script>$(function(){$("#puzzle-piece").draggable({containment:"#captcha-container"});$("#captcha-form").submit(function(e){varpos=$("#puzzle-piece").position();$("#piece_x").val(Math.round(pos.left));$("#piece_y").val(Math.round(pos.top));returntrue;});});</script><divclass="foot">©WoR2025[<ahref="exit.php">x</a>]<br></div></body></html>

    // плавающий скрипт хэш 2931440912
    // (function(){consttimeDiff=Date.now()-TIMESTAMP;functionupdateBars(){constnow=Date.now()-timeDiff;letelapsedSeconds=(now-TIMESTAMP)/NUMBER;letnewLife=Math.min(Math.round(NUMBER+NUMBER.TIMESTAMP*elapsedSeconds),NUMBER);letnewMana=Math.min(Math.round(NUMBER+NUMBER*elapsedSeconds),NUMBER);constheaderHP=document.querySelector('.hp-fill');constheaderMana=document.querySelector('.mp-fill');if(headerHP&&headerMana){headerHP.style.height=Math.round((newLife/NUMBER)*NUMBER)+'%';headerMana.style.height=Math.round((newMana/NUMBER)*NUMBER)+'%';}}setInterval(updateBars,NUMBER);})();
    HTML_HASH = 4151032727;
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
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function () {
                const base64Image = reader.result;

                chrome.runtime.sendMessage({
                    action: "sendRequestResoleCaptcha",
                    data: {imageBase64: base64Image}
                }, function (response) {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError.message);
                    } else if (!response) {
                        reject("Нет ответа от background");
                    } else if (response.success) {
                        resolve(response.data); // <- вернёт то, что прислал сервер
                    } else {
                        reject(response.error || "Ошибка при распознавании");
                    }
                });
            };

            reader.onerror = function () {
                reject("Ошибка чтения файла");
            };

            reader.readAsDataURL(image);
        });
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
        let cleanedHTML = htmlWithoutChat.replace(/\s+/g, '');

        cleanedHTML = cleanedHTML.replace('вводится1разна<spanclass="svet">12</span>групп', '');
        cleanedHTML = cleanedHTML.replace('вводится1разна<spanclass="svet">10</span>сборов', '');
        cleanedHTML = cleanedHTML.replaceAll('primanka.php', 'cap.php');

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