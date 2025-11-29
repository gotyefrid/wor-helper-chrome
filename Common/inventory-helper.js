(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    await mergeButton();
    await dynamicSearch()
})();

async function mergeButton() {
    /* 1. находим тот самый <td> через любую из уже-существующих ссылок
          (берём ближайшую родительскую ячейку)                       */
    const td = document.querySelector('#toggle-checkboxes')?.closest('td');
    if (!td) return;                  // safety-check: вдруг разметка изменилась

    /* 2. создаём новую ссылку «Объеденить предметы» */
    const link = document.createElement('a');
    link.href = '#';
    link.id = 'merge-items';        // пригодится, если потом понадобятся стили
    link.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16"
               style="vertical-align:middle;"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M2 3v2h5v2l3-3L7 1v2H2zm0 8v2h5v2l3-3-3-3v2H2z"
                  fill="currentColor"/>
          </svg>Объеденить&nbsp;всё`;

    /* 3. навешиваем обработчик-заглушку */
    link.addEventListener('click', event => {
        event.preventDefault();         // не даём браузеру перейти по «#»
        mergeContent();
    });

    /* 4. добавляем ссылку в конец содержимого <td> */
    td.appendChild(document.createTextNode(' ')); // пробел перед новой ссылкой
    td.appendChild(link);
}

function mergeContent() {
    CommonHelper.log('Объединяем вещи, если есть что объединять', false);
    // Находим все div с классом invcell
    const invCells = document.querySelectorAll("div.invcell");

    // Создаем карту для хранения текста itemlink и соответствующих div.invcell
    const itemMap = new Map();

    invCells.forEach(invCell => {
        const itemLink = invCell.querySelector("a[href^='itemlink']");

        if (itemLink) {
            let itemText = itemLink.nextSibling.textContent.trim();
            let invText = invCell.innerText;
            invText = invText.replace('Объединить', '');
            invText = invText.replace('Разделить', '');
            invText = invText.replace('Использовать', '');
            // только с одинаковыми требованиями
            let dop1 = invText.match(/Требования:\s*([\s\S]*?)\s*Свойства:/i);
            dop1 = dop1 ? dop1[1].trim() : '';
            // только с одинаковыми свойствами, исключая ёмкости
            let dop2 = invText.match(/Свойства:\s*([\s\S]*?)\s*Продать/i);
            dop2 = dop2 ? dop2[1].trim() : '';
            dop2 = dop2.replace(/\s*Емкость:\s*\d+\s*/gi, '');

            // и одинаковая картинка
            let srcImg = invCell.querySelectorAll('img')[1]?.src?.split('/')?.pop();

            itemText = itemText + dop1 + dop2 + srcImg, toString();

            if (!itemMap.has(itemText)) {
                itemMap.set(itemText, []);
            }

            itemMap.get(itemText).push(invCell);
        }
    });

    (async () => {
        /* ► скрытый iframe-приёмник */
        let bgFrame = document.getElementById('bgMergeFrame');
        if (!bgFrame) {
            bgFrame = document.createElement('iframe');
            bgFrame.name = 'bgMergeFrame';
            bgFrame.id = 'bgMergeFrame';
            bgFrame.style.display = 'none';
            document.body.appendChild(bgFrame);
        }

        /* ► util-пауза */
        const sleep = ms => new Promise(r => setTimeout(r, ms));

        /* ► счётчики */
        let success = 0;
        let fail = 0;
        let touched = 0;         // сколько предметов вообще пытались объединить

        /* ► основной цикл */
        for (const [itemText, cells] of itemMap) {
            if (cells.length <= 1) continue;                 // нужен дубликат
            const link = cells[0].querySelector("a[href^='tosoed']");
            if (!link) continue;

            touched++;

            try {
                /* 1) тянем HTML «объединить» */
                const resp = await fetch(link.href, {
                    credentials: 'include',
                    redirect: 'follow'      // разрешаем 3xx
                });
                if (!resp.ok) throw `HTTP ${resp.status}`;

                const html = await resp.text();

                /* 2) достаём form#form2 */
                const doc = new DOMParser().parseFromString(html, 'text/html');
                const form = doc.getElementById('form2');
                if (!form) throw 'form2 not found';

                /* 3) клонируем, задаём target, прячем, вставляем */
                const cloned = form.cloneNode(true);
                cloned.id = 'mergeForm_' + Date.now();
                cloned.target = bgFrame.name;
                cloned.style.display = 'none';
                document.body.appendChild(cloned);

                /* 4) сабмит */
                cloned.requestSubmit?.() || cloned.submit();
                success++;
                CommonHelper.log(`✔ "${itemText}" объединён`);

            } catch (err) {
                fail++;
                CommonHelper.log(`✖ "${itemText}" — ошибка:`, err);
            }

            /* 5) пауза 300 мс */
            await sleep(300);
        }

        /* ► итоговое уведомление */
        if (touched === 0) {
            alert('Подходящих предметов для объединения не найдено.');
        } else if (fail === 0) {
            alert(`Все ${success} предмет(ов) успешно объединены!`);
            CommonHelper.reloadPage();
        } else {
            alert(`Объединение завершено.\nУспешно: ${success}\nОшибки: ${fail}`);
            CommonHelper.reloadPage();
        }
    })();
}

async function dynamicSearch() {
    const td = document.querySelector('#toggle-checkboxes')?.closest('td');
    if (!td) return;

    const searchDiv = document.createElement('div');

    searchDiv.id = 'fast-searsh-items';
    searchDiv.style.marginTop = '2px';
    searchDiv.style.marginBottom = '5px';
    searchDiv.innerHTML = `<input id="fastserach" type="text" placeholder="Быстрый поиск" class="checkbox">`;

    searchDiv.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            // Отменяем стандартное поведение (отправка формы) и глушим другие слушатели:
            event.preventDefault();
            event.stopImmediatePropagation();
            if (event.target.value) {
                [...document.querySelectorAll('.navigation')].map(div => div.style.display = 'none');
            } else {
                [...document.querySelectorAll('.navigation')].map(div => div.style.display = 'block');
            }

            let searchLink = document.querySelector('a[href*="textsearch=1"]');
            let searchPage = await fetch(searchLink.href);
            searchPage = await searchPage.text();
            // ищем строку внутри одинарных кавычек после document.location.href =
            const match = searchPage.match(/document\.location\.href\s*=\s*'([^']+)'/);

            if (match) {
                const url = match[1] + event.target.value;
                const response = await fetch(url);
                const result = await response.text();
                const doc = new DOMParser().parseFromString(result, 'text/html');
                const cells = doc.querySelector('div[style*="display: flex; flex-wrap: wrap;"');

                if (cells) {
                    document.querySelector('div[style*="display: flex; flex-wrap: wrap;"').outerHTML = cells.outerHTML;
                } else {
                    document.querySelector('div[style*="display: flex; flex-wrap: wrap;"').outerHTML = `<div style="display: flex; flex-wrap: wrap;">
                    <div style="margin: 10px 0">Нет вещей в секции</div>        </div>`
                }
            }


        }
    });

    td.appendChild(document.createTextNode(' '));
    td.appendChild(searchDiv);
}