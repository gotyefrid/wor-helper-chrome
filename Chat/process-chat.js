(async function () {

    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    addQuickPost();
    contextMenu();
    setupBattleHoverPreview();
})();

function contextMenu() {
    // === ВСТРАИВАЕМ СТИЛИ ДЛЯ МЕНЮ ===
    const style = document.createElement('style');
    style.textContent = `
        #customContextMenu {
            position: absolute;
            display: none;
            background: rgba(30, 30, 30, 0.85);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            z-index: 10000;
            cursor: pointer;
            box-shadow: 2px 2px 6px rgba(0,0,0,0.4);
            min-width: 160px;
            border-radius: 6px;
            overflow: hidden;
            opacity: 0;
            transition: opacity 0.15s ease;
        }
        #customContextMenu div {
            padding: 8px 14px;
            cursor: pointer;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            font-family: sans-serif;
            font-size: 13px;
            letter-spacing: 0.5px;
            color: #ccc;
            transition: background 0.2s, color 0.2s, text-shadow 0.2s;
        }
        #customContextMenu div:hover {
            background: rgba(255, 255, 255, 0.15);
            color: #fff;
            text-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
        }
        #customContextMenu div:last-child {
            border-bottom: none;
        }
    `;
    document.head.appendChild(style);

    // === СОЗДАЁМ МЕНЮ ===
    const menu = document.createElement('div');
    menu.id = 'customContextMenu';
    document.body.appendChild(menu);

    let currentTarget = null;

    // === ПУНКТЫ МЕНЮ ===
    const menuItems = [
        {
            label: '👤 Перейти в профиль',
            onClick: (nickname) => {
                window.open(`/wap/infouser.php?name=${encodeURIComponent(nickname)}`, '_blank');
            }
        },
        {
            label: '💰 Отправить WR',
            onClick: (nickname) => {
                showWRModal(nickname); // предполагается, что эта функция уже определена
            }
        },
        {
            label: '📋 Копировать ник',
            onClick: async (nickname, event) => {
                const textarea = document.createElement('textarea');
                textarea.value = nickname;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);

                let target = event.target;
                target.textContent = 'Скопировано!';

                await CommonHelper.delay(400);
            }
        }
    ];

    // === ОБРАБОТЧИК КОНТЕКСТНОГО МЕНЮ ===
    document.addEventListener('contextmenu', (e) => {
        const el = e.target.closest('a[onclick*="chatline.komy"]');

        if (el && e.shiftKey) {
            return;
        }

        if (el) {
            e.preventDefault();
            currentTarget = el;

            const onclickAttr = el.getAttribute('onclick') || '';
            const match = onclickAttr.match(/'([^']+)'/);
            const nickname = match ? match[1] : null;

            if (!nickname) return;

            menu.innerHTML = ''; // очистить старое

            menuItems.forEach(async (item) => {
                const div = document.createElement('div');
                div.textContent = item.label;
                div.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await item.onClick(nickname, e);
                    hideMenu();
                });
                menu.appendChild(div);
            });

            menu.style.display = 'block';
            menu.style.visibility = 'hidden';

            setTimeout(() => {
                const menuHeight = menu.offsetHeight;
                const offsetY = 5;
                const top = Math.max(e.pageY - menuHeight - offsetY, 0);

                menu.style.top = `${top}px`;
                menu.style.left = `${e.pageX - 160}px`;
                menu.style.visibility = 'visible';
                menu.style.opacity = '1';
            }, 0);
        } else {
            hideMenu();
        }
    });

    // === СКРЫТИЕ МЕНЮ ===
    function hideMenu() {
        menu.style.opacity = '0';
        setTimeout(() => {
            menu.style.display = 'none';
        }, 150);
    }

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target)) {
            hideMenu();
        }
    });

    document.addEventListener('scroll', () => {
        hideMenu();
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

async function addQuickPost() {
    let form = document.querySelector('#chatline');
    let quickMenu = await CommonHelper.getExtStorage('wor_chat_fast_answers_active');

    if (!form || !quickMenu) {
        return;
    }

    // 1. Получаем из стораджа массивы (или пустые массивы по умолчанию)
    const answers = await CommonHelper.getExtStorage('wor_chat_fast_answers') || [];
    const addresses = await CommonHelper.getExtStorage('wor_chat_fast_address') || [];

    // 2. Вставляем два ваших статичных спана (метки)
    form.insertAdjacentHTML(
        "afterend",
        '<span class="" style="margin: 0 3px 0 10px;">Теги:</span>'
    );
    form.insertAdjacentHTML(
        "afterend",
        '<span class="" style="margin: 0 3px 0 10px;">Кому:</span>'
    );

    // 3. Находим эти спаны по текстовому содержимому
    const container = form.parentNode;
    const labels = Array.from(container.querySelectorAll('span'))
        .filter(el => ['Теги:', 'Кому:'].includes(el.textContent.trim()));

    const tagsLabel = labels.find(el => el.textContent.trim() === 'Теги:');
    const addressesLabel = labels.find(el => el.textContent.trim() === 'Кому:');

    // 4. Динамически создаём ссылки «ответы» (Теги)
    //    Проходим по answers в обратном порядке, чтобы при вставке
    //    через afterend итоговый порядок совпал с исходным
    answers.slice().reverse().forEach(item => {
        const [key, val] = item.split(':').map(s => s.trim());
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'svet';
        a.style.margin = '0 3px';
        a.textContent = key;
        a.addEventListener('click', e => {
            e.preventDefault();
            const inp = document.getElementById('postmessage');
            if (inp) inp.value += val;
        });
        tagsLabel.insertAdjacentElement('afterend', a);
    });

    // 5. Динамически создаём ссылки «кому» (Адреса)
    addresses.slice().reverse().forEach(item => {
        const parts = item.split(':').map(s => s.trim());
        const key = parts[0];
        const val = parts[1] || '';
        const opt = parts[2];  // если есть «:1» — будет '1'

        const a = document.createElement('a');
        a.href = '#';
        a.className = 'svet';
        a.style.margin = '0 3px';
        a.textContent = key;
        a.addEventListener('click', e => {
            e.preventDefault();
            const inp = document.getElementById('postuser');
            if (inp) inp.value = val;
            if (opt === '1') {
                const cb = document.getElementById('postprivat');
                if (cb) cb.checked = true;
            }
        });
        addressesLabel.insertAdjacentElement('afterend', a);
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


