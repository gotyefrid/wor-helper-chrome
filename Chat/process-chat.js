(async function () {

    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    addQuickPost();
    contextMenu();
    setupBattleHoverPreview();
})();


function contextMenu() {
    const menu = document.createElement('div');
    menu.id = 'customContextMenu';
    menu.style.position = 'absolute';
    menu.style.display = 'none';
    menu.style.background = '#fff';
    menu.style.border = '1px solid #ccc';
    menu.style.zIndex = 10000;
    menu.style.cursor = 'pointer';
    menu.style.color = 'black';
    menu.style.boxShadow = '2px 2px 6px rgba(0,0,0,0.2)';
    menu.style.minWidth = '150px';

    document.body.appendChild(menu);

    let currentTarget = null;

    // Массив пунктов меню (расширяемый)
    const menuItems = [
        {
            label: 'Перейти в профиль',
            onClick: (nickname) => {
                window.open(`/wap/infouser.php?name=${encodeURIComponent(nickname)}`, '_blank');
            }
        },
        {
            label: 'Отправить WR',
            onClick: (nickname) => {
                showWRModal(nickname);
            }
        }
        // Добавляй новые пункты здесь
    ];

    // Показываем меню
    document.addEventListener('contextmenu', (e) => {
        const el = e.target.closest('a[onclick*="chatline.komy"]');
        if (el) {
            currentTarget = el;

            const onclickAttr = el.getAttribute('onclick') || '';
            const match = onclickAttr.match(/'([^']+)'/);
            const nickname = match ? match[1] : null;

            if (!nickname) return;

            // Очистить старое меню
            menu.innerHTML = '';

            // Добавить пункты заново
            menuItems.forEach(item => {
                const div = document.createElement('div');
                div.textContent = item.label;
                div.style.padding = '6px 10px';
                div.style.cursor = 'pointer';
                div.style.borderBottom = '1px solid #eee';

                div.addEventListener('click', (e) => {
                    e.stopPropagation();
                    item.onClick(nickname);
                    menu.style.display = 'none';
                });

                div.addEventListener('mouseenter', () => {
                    div.style.background = '#f0f0f0';
                });
                div.addEventListener('mouseleave', () => {
                    div.style.background = '';
                });

                menu.appendChild(div);
            });

            // Подготовка для измерения высоты
            menu.style.display = 'block';
            menu.style.visibility = 'hidden'; // скрыть, но чтобы layout работал

            // Подождать рендер (можно через requestAnimationFrame)
            setTimeout(() => {
                const menuHeight = menu.offsetHeight;
                const offsetY = 5; // дополнительное смещение
                const top = Math.max(e.pageY - menuHeight - offsetY, 0);

                menu.style.top = `${top}px`;
                menu.style.left = `${e.pageX - 150}px`;
                menu.style.visibility = 'visible'; // показать снова
            }, 0);
        } else {
            menu.style.display = 'none';
        }
    });

    // Скрыть при клике вне меню
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) {
            menu.style.display = 'none';
        }
    });

    // Скрыть при прокрутке
    document.addEventListener('scroll', () => {
        menu.style.display = 'none';
    }, true);
}

function showWRModal(nickname) {
    // Если уже есть модалка — не создаём повторно
    if (document.getElementById('wrModal')) return;

    // Создание затемнённого фона
    const overlay = document.createElement('div');
    overlay.id = 'wrOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = 10001;

    // Создание модального окна
    const modal = document.createElement('div');
    modal.id = 'wrModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.padding = '20px';
    modal.style.border = '1px solid #ccc';
    modal.style.zIndex = 10002;
    modal.style.minWidth = '300px';
    modal.style.textAlign = 'center';
    modal.style.background = 'rgba(0, 0, 0, 0.5)';
    modal.style.backdropFilter = 'blur(6px)';
    modal.style.webkitBackdropFilter = 'blur(6px)'; // для Safari

    // Заголовок
    const title = document.createElement('h3');
    title.textContent = `Отправить WR: ${nickname}`;
    modal.appendChild(title);

    // Форма
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'suma';
    input.value = '0';
    input.style.marginTop = '10px';
    input.className = 'do_button';
    modal.appendChild(input);

    const label = document.createElement('span');
    label.textContent = ' WR';
    modal.appendChild(label);

    // Кнопка отправки
    const sendBtn = document.createElement('button');
    sendBtn.textContent = 'Передать';
    sendBtn.className = 'button';
    sendBtn.style.display = 'block';
    sendBtn.style.margin = '15px auto 0';

    sendBtn.addEventListener('click', () => {
        const amount = input.value.trim();
        if (!/^\d+$/.test(amount) || parseInt(amount) <= 0) {
            alert('Введите корректную сумму WR.');
            return;
        }

        // Создаём FormData
        const data = new FormData();
        data.append('nameperedat', nickname);
        data.append('suma', amount);

        // Отправка POST-запроса
        fetch('permoneyact.php', {
            method: 'POST',
            body: data,
        })
            .then(response => {
                if (response.url.includes('boj')) {
                    throw new Error('Персонаж находится в бою, нельзя переслать деньги');
                }
                return response.text();
            })
            .then(text => {
                alert('Успешно отправлено!');
                document.body.removeChild(overlay);
                document.body.removeChild(modal);
                CommonHelper.reloadPage();
            })
            .catch(error => {
                alert('Ошибка: ' + error.message);
                document.body.removeChild(overlay);
                document.body.removeChild(modal);
            });
    });

    modal.appendChild(sendBtn);

    // Закрытие по клику вне окна
    overlay.addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    });

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}

function addQuickPost() {
    let form = document.querySelector('#chatline');

    if (!form) {
        return;
    }

    form.insertAdjacentHTML("afterend", '<a id="persInfo" class="svet" style="margin: 0 3px 0 3px;">Перс</a>');
    form.insertAdjacentHTML("afterend", '<a id="bojInfo" class="svet" style="margin: 0 3px 0 3px;">Бой</a>|');
    form.insertAdjacentHTML("afterend", '<a id="taktInfo" class="svet" style="margin: 0 3px 0 3px;">Такт</a>|');
    form.insertAdjacentHTML("afterend", '<span class="" style="margin: 0 3px 0 10px;">Теги:</span>');
    form.insertAdjacentHTML("afterend", '<a id="toKlan" class="svet" style="margin: 0 3px 0 3px;">Клан</a>');
    form.insertAdjacentHTML("afterend", '<a id="toDak" class="svet" style="margin: 0 3px 0 3px;">Дак</a>|');
    form.insertAdjacentHTML("afterend", '<a id="toGwatlow" class="svet" style="margin: 0 3px 0 3px;">Gwatlow</a>|');
    form.insertAdjacentHTML("afterend", '<span class="" style="margin: 0 3px 0 10px;">Кому:</span>');

    document.querySelectorAll('#toGwatlow, #toDak, #toKlan, #taktInfo, #BojInfo, #PersInfo')
        .forEach(el => el.style.cursor = 'pointer');

    // Обработчики
    document.getElementById('toGwatlow')?.addEventListener('click', (e) => {
        e.preventDefault();
        let input = document.getElementById('postuser');
        if (input) input.value = "Gwatlow";
    });

    document.getElementById('toDak')?.addEventListener('click', (e) => {
        e.preventDefault();
        let input = document.getElementById('postuser');
        if (input) input.value = "Дональд Дак";
    });

    document.getElementById('toKlan')?.addEventListener('click', (e) => {
        e.preventDefault();

        let input = document.getElementById('postuser');
        if (input) input.value = "Дональд Дак, Benz, WheeL, Gwatlow, Ali_ba_ba, -SlenceR-, ЗУБРИК, Пипец";

        let checkbox = document.getElementById('postprivat');
        if (checkbox) checkbox.checked = true;
    });

    document.getElementById('taktInfo')?.addEventListener('click', (e) => {
        e.preventDefault();
        let input = document.getElementById('postmessage');
        if (input) input.value += "[battle][/battle]";
    });

    document.getElementById('bojInfo')?.addEventListener('click', (e) => {
        e.preventDefault();
        let input = document.getElementById('postmessage');
        if (input) input.value += "[log][/log]";
    });

    document.getElementById('persInfo')?.addEventListener('click', (e) => {
        e.preventDefault();
        let input = document.getElementById('postmessage');
        if (input) input.value += "[inf][/inf]";
    });
}

function setupBattleHoverPreview() {
    const preview = document.createElement('div');
    preview.id = 'battlePreview';
    preview.style.position = 'fixed';
    preview.style.display = 'none';
    preview.style.zIndex = 10000;
    preview.style.color = '#fff';
    preview.style.border = '1px solid #666';
    preview.style.padding = '10px';
    preview.style.maxWidth = '500px';
    preview.style.maxHeight = '400px';
    preview.style.overflow = 'auto';
    preview.style.boxShadow = '2px 2px 6px rgba(0,0,0,0.5)';
    preview.style.fontSize = '12px';
    preview.style.borderRadius = '4px';
    preview.style.background = 'rgba(0, 0, 0, 0.5)';
    preview.style.backdropFilter = 'blur(6px)';
    preview.style.webkitBackdropFilter = 'blur(6px)'; // для Safari

    document.body.appendChild(preview);

    let currentLink = null;
    let hideTimeout = null;

    async function showBattlePreview(link, x, y) {
        if (currentLink === link) return; // не перезапрашивать, если уже показываем
        currentLink = link;

        preview.innerHTML = 'Загрузка...';
        preview.style.display = 'block';
        preview.style.top = `${y + 10}px`;
        preview.style.left = `${x + 10}px`;

        try {
            const response = await fetch(link.href);
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const table = doc.querySelector('table');

            preview.innerHTML = table?.outerHTML || '<div>Нет данных</div>';
        } catch (err) {
            preview.innerHTML = '<div style="color: red;">Ошибка загрузки данных о бое</div>';
        }
    }

    // Делегируем наведение на ссылку
    document.addEventListener('mouseover', (e) => {
        const link = e.target.closest('a[href*="log.php?boj="]');
        if (!link) return;

        clearTimeout(hideTimeout);

        const x = e.clientX;
        const y = e.clientY;
        showBattlePreview(link, x, y);
    });

    // Убираем модалку с задержкой
    document.addEventListener('mouseout', (e) => {
        const link = e.target.closest('a[href*="log.php?boj="]');
        if (link) {
            hideTimeout = setTimeout(() => {
                if (!preview.matches(':hover')) {
                    preview.style.display = 'none';
                    currentLink = null;
                }
            }, 200); // небольшая задержка, чтобы успеть перейти
        }
    });

    // Если покинули саму модалку — тоже скрыть
    preview.addEventListener('mouseleave', () => {
        hideTimeout = setTimeout(() => {
            preview.style.display = 'none';
            currentLink = null;
        }, 100);
    });

    // Если вошли в модалку — отменяем скрытие
    preview.addEventListener('mouseenter', () => {
        clearTimeout(hideTimeout);
    });
    
    // Закрыть модалку при любом скролле
    window.addEventListener('scroll', () => {
        preview.style.display = 'none';
        currentLink = null;
    }, { passive: true });
}
