class Chat {
    isChatPage = false;

    constructor() {
        this.#checkCurrentPage();
    }

    async #checkCurrentPage() {
        this.isChatPage = document.querySelector('#msg_box') !== null;
    }

    /**
     * @deprecated Используй getParsedMessagesNew — он возвращает более подробные объекты
     *             с полями type (SYSTEM/PUBLIC/PUBLIC_TO/PRIVATE), isPrivate, isForMe, date, id.
     */
    static getParsedMessages(msgBox = null) {
        if (!msgBox) {
            // Получаем div id "msg_box"
            msgBox = document.querySelector("div#msg_box");
        }

        const params = new URLSearchParams(window.location.search);
        const strParam = params.get('str');
        const mymessParam = params.get('mymess');
        const str = parseFloat(strParam);

        if (mymessParam !== null || (strParam !== null && str >= 2)
        ) {
            CommonHelper.log('Мы не первой странице общего чата, а значит не актуальные сообщения не добавляем');
            return [];
        }

        let messages = [];

        // Разбиваем содержимое <div> по <br>
        let parts = msgBox.innerHTML.split("<br>");

        parts.forEach(part => {
            // Создаём временный div для проверки содержимого
            let tempDiv = document.createElement("div");
            tempDiv.innerHTML = part.trim();

            // Проверяем, есть ли внутри элемент с классом "navigation"
            if (tempDiv.querySelector(".navigation")) {
                return; // Пропускаем итерацию
            }

            // Если контент не пустой, добавляем в messages
            if (tempDiv.innerHTML !== "") {
                messages.push(tempDiv);
            }
        });

        let pureTexts = messages.map(element => {
            // Проверяем, есть ли в элементе дочерний элемент с классом "svet"
            let isSystem = element.querySelector(".svet") !== null;

            // Извлекаем текст из текстовых узлов и элементов с innerText + смайлы
            let extractedText = Array.from(element.childNodes)
                .map(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        return node.nodeValue.trim();
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.classList.contains('contur')) {
                            return '';
                        }
                        // Проверяем, является ли элемент ссылкой <a> со смайлом <img>
                        let smileImg = node.querySelector("img");
                        if (smileImg && node.hasAttribute("onclick")) {
                            // Извлекаем идентификатор смайла из onclick
                            let match = node.getAttribute("onclick").match(/'(.+?)'/);
                            if (match) {
                                return match[1].trim(); // Добавляем идентификатор смайла
                            }
                        }

                        // В остальных случаях просто берём текст элемента
                        return node.innerText.trim();
                    }
                    return "";
                })
                .filter(text => text.length > 0) // Исключаем пустые строки
                .join(" "); // Объединяем в строку

            // Добавляем "system" или "chat" в начало строки
            return (isSystem ? "system" : "chat") + " " + extractedText;
        });

        let parsedMessages = pureTexts.map(msg => {
            // Разбиваем строку на части
            let parts = msg.split(/\s+/); // Разделяем по пробелам

            // Определяем тип (первое слово в строке)
            let type = parts.shift(); // "system" или "chat"

            // Вытаскиваем время (оно всегда в формате HH:MM:SS)
            let time = parts.shift();

            // Остальную часть склеиваем обратно в строку
            let remainingText = parts.join(" ");

            let from = "system"; // По умолчанию для "system"
            let to = "";
            let text = remainingText; // Пока считаем, что весь остаток — это текст

            // Если это "chat", то парсим from и to
            if (type === "chat") {
                let match = remainingText.match(/^(.*?):\s*(.*?)$/); // Регулярка для поиска "Игрок: текст" или "Игрок для Игрок2: текст"
                if (match) {
                    from = match[1]; // Игрок, который отправил сообщение
                    text = match[2]; // Оставшийся текст

                    // Проверяем, есть ли "для {игрок}" внутри from
                    let toMatch = from.match(/(.*?)\s+для\s+(.*)/);
                    if (toMatch) {
                        from = toMatch[1].trim(); // Исправляем имя отправителя
                        to = toMatch[2].trim(); // Имя получателя
                    }
                }
            }

            return {type, time, from, to, text};
        });

        return parsedMessages;
    }

    /**
     * Возвращает массив объектов сообщений
     * [{
     *     "type": string (SYSTEM || PUBLIC || PUBLIC_TO)
     *     "from": string,
     *     "to": string,
     *     "time": "19:10:59",
     *     "text": string,
     *     "isPrivate": bool, -- если это приватное личное сообщение (видят только двое)
     *     "isForMe": bool, -- если это личное сообщение (видят все)
     *     "date": "2026-03-05",
     *     "id": string
     * }...]
     * @param msgBox
     * @param myNick
     * @returns {*[]}
     */
    static getParsedMessagesNew(msgBox = null, myNick = null) {
        if (!msgBox) {
            // Получаем div id "msg_box"
            msgBox = document.querySelector("div#msg_box");
        }

        function kyivDateStr() {
            const kyiv = new Date(new Date().toLocaleString('en-US', {timeZone: 'Europe/Kyiv'}));
            const y = kyiv.getFullYear();
            const mo = String(kyiv.getMonth() + 1).padStart(2, '0');
            const d = String(kyiv.getDate()).padStart(2, '0');
            return `${y}-${mo}-${d}`;
        }

        function prevDay(dateStr) {
            const d = new Date(dateStr + 'T12:00:00');
            d.setDate(d.getDate() - 1);
            const y = d.getFullYear();
            const mo = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${mo}-${day}`;
        }

        function timeToSec(t) {
            if (!t || !/^\d{2}:\d{2}:\d{2}$/.test(t)) return -1;
            const [h, m, s] = t.split(':').map(Number);
            return h * 3600 + m * 60 + s;
        }

        function nodeToText(node) {
            if (node.nodeType === Node.TEXT_NODE) return node.textContent;
            if (node.nodeName === 'IMG') {
                const src = node.getAttribute('src') || '';
                return src.includes('smiles') ? (node.getAttribute('alt') || '') : '';
            }
            if (node.nodeType === Node.ELEMENT_NODE) {
                return Array.from(node.childNodes).map(nodeToText).join('');
            }
            return '';
        }

        function bodyText(nodes) {
            return nodes.map(nodeToText).join('').trim().replace(/\s+/g, ' ');
        }

        function senderFromLink(linkEl) {
            if (!linkEl) return null;
            const onclick = linkEl.getAttribute('onclick') || '';
            const m = onclick.match(/komy\.value='([^']+)'/);
            return m ? m[1] : (linkEl.textContent || '').trim().replace(/:$/, '').trim();
        }

        function timeFromStrong(strong) {
            const span = strong.querySelector('span[style*="FAA134"]');
            return span ? span.textContent.trim() : null;
        }

        function splitByBr() {
            const result = [];
            let buf = [];
            for (const node of msgBox.childNodes) {
                if (node.nodeName === 'BR') {
                    if (buf.length) {
                        const wrap = document.createElement('div');
                        buf.forEach(n => wrap.appendChild(n.cloneNode(true)));
                        result.push(wrap);
                        buf = [];
                    }
                } else {
                    buf.push(node);
                }
            }
            if (buf.length) {
                const wrap = document.createElement('div');
                buf.forEach(n => wrap.appendChild(n.cloneNode(true)));
                result.push(wrap);
            }
            return result;
        }

        function parseSystem(svetSpan) {
            const strong = svetSpan.querySelector('strong');
            if (!strong) return null;
            const time = timeFromStrong(strong);
            let to = null;
            const sysImg = strong.querySelector('img[src*="system_my"]');
            if (sysImg) {
                const raw = sysImg.getAttribute('alt') || sysImg.getAttribute('title') || '';
                const m = raw.match(/для\s+(.+?):/);
                // if (m) to = m[1].trim(); если нужно будет отравлять систему для меня а не общую
            }
            const bodyNodes = Array.from(svetSpan.childNodes).filter(n => n !== strong);
            return {type: 'SYSTEM', from: '[[[ Система ]]]', to, time, text: bodyText(bodyNodes)};
        }

        // #FF5555 (красный) → PRIVATE, #4488FF (синий) → PUBLIC_TO
        function parseColoredPersonal(span, type) {
            const strongs = Array.from(span.querySelectorAll(':scope > strong'));
            if (!strongs.length) return null;
            const time = timeFromStrong(strongs[0]);
            const from = senderFromLink(strongs[0].querySelector('a[onclick]'));
            const to = strongs[1] ? senderFromLink(strongs[1].querySelector('a[onclick]')) : null;
            const lastStrong = strongs[strongs.length - 1];
            const bodyNodes = [];
            let after = false;
            for (const child of span.childNodes) {
                if (after) bodyNodes.push(child);
                if (child === lastStrong) after = true;
            }
            return {type, from, to, time, text: bodyText(bodyNodes)};
        }

        function parsePublic(wrap) {
            const allChildren = Array.from(wrap.childNodes);
            const directStrongs = allChildren.filter(n => n.nodeName === 'STRONG');
            if (!directStrongs.length) return null;
            const firstStrong = directStrongs[0];
            const time = timeFromStrong(firstStrong);
            const from = senderFromLink(firstStrong.querySelector('a[onclick]'));
            const isPublicTo = directStrongs.length >= 2;
            const to = isPublicTo ? senderFromLink(directStrongs[1].querySelector('a[onclick]')) : null;
            const lastHeader = isPublicTo ? directStrongs[1] : directStrongs[0];
            const bodyNodes = allChildren.slice(allChildren.indexOf(lastHeader) + 1);
            return {type: isPublicTo ? 'PUBLIC_TO' : 'PUBLIC', from, to, time, text: bodyText(bodyNodes)};
        }

        function parseFragment(wrap) {
            const firstEl = Array.from(wrap.children)[0];
            if (!firstEl) return null;
            if (firstEl.tagName === 'SPAN' && firstEl.classList.contains('svet')) return parseSystem(firstEl);
            if (firstEl.tagName === 'SPAN') {
                const style = firstEl.getAttribute('style') || '';
                if (style.toLowerCase().includes('ff5555')) return parseColoredPersonal(firstEl, 'PRIVATE');
                if (style.toLowerCase().includes('4488ff')) return parseColoredPersonal(firstEl, 'PUBLIC_TO');
            }
            if (firstEl.tagName === 'STRONG') return parsePublic(wrap);
            return null;
        }

        function assignDates(msgs) {
            let date = kyivDateStr();
            let prevSec = Infinity;
            for (const msg of msgs) {
                const sec = timeToSec(msg.time || '');
                if (sec !== -1 && sec > prevSec) date = prevDay(date);
                msg.date = date;
                if (sec !== -1) prevSec = sec;
            }
        }

        function makeId(msg) {
            return `${msg.date}|${msg.time}|${msg.from}|${msg.to}|${(msg.text || '').slice(0, 40)}`;
        }

        // ── build result ──────────────────────────────────────────────────────
        const msgs = [];
        for (const wrap of splitByBr()) {
            const msg = parseFragment(wrap);
            if (!msg) continue;
            msg.isPrivate = msg.type === 'PRIVATE';
            msg.isForMe = myNick ? (msg.to || '').toLowerCase() === myNick.toLowerCase() : false;
            msgs.push(msg);
        }
        assignDates(msgs);
        for (const msg of msgs) msg.id = makeId(msg);

        return msgs;
    }
}