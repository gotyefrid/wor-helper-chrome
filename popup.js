document.addEventListener("DOMContentLoaded", async function () {
    // Обработчик чекбоксов
    processCheckboxes();
    processInputs();

    // Обработчики парсинга
    processParsing();

    processChat();
    processMap();

    // Обработчик рыбалки
    processFishing();

    // Обработчик выбора боссов
    processFightingBossesModal();

    processQuests();
});

async function processCheckboxes() {
    // Определяем настройки переключателей
    const toggles = {
        toggleFishing: {
            storageKey: "wor_fishing_active",
            hasSubOptions: true,
        },
        toggleFishingOptActiveButton: { storageKey: "wor_fishing_opt_active_button" },
        toggleAlchemistry: {
            storageKey: "wor_chemistry_active",
            hasSubOptions: true,
        },
        toggleAlchemistryOptActiveButton: { storageKey: "wor_chemistry_opt_active_button" },

        toggleMining: {
            storageKey: "wor_mining_active",
            hasSubOptions: true,
        },
        toggleMiningOptActiveButton: { storageKey: "wor_mining_opt_active_button" },
        toggleMoving: { storageKey: "wor_moving_active" },
        toggleCaptcha: {
            storageKey: "wor_captcha_active",
            hasSubOptions: true,
        },
        toggleMapHistory: {
            storageKey: "wor_maphistory_active",
            hasSubOptions: true,
        },
        toggleMapHistoryOptWalkAllPoints: { storageKey: "wor_map_walk_all_map_active" },
        toggleLog: { storageKey: "wor_log_active" },

        toggleFighting: {
            storageKey: "wor_fight_active",
            hasSubOptions: true,
        },
        toggleFightingGiveUp: { storageKey: "wor_fight_give_up_active", },
        toggleFightingPotHP: { storageKey: "wor_fight_pot_hp_active", },
        toggleFightingPotMP: { storageKey: "wor_fight_pot_mp_active", },
        toggleFightingCheckTrauma: { storageKey: "wor_fight_check_trauma", },
        toggleFightingActivatePrimanka: { storageKey: "wor_fight_activate_primanka", },
        toggleFightingOptActiveButton: { storageKey: "wor_fight_opt_active_button" },
        toggleFightingOnlyMobs: { storageKey: "wor_fight_only_mobs", defaultValue: true },

        toggleTakt: {
            storageKey: "wor_takt_active",
            hasSubOptions: true,
        },
        toggleTaktOptActiveButton: { storageKey: "wor_takt_opt_active_button" },

        toggleBandits: { storageKey: "wor_bandits_active" },

        toggleParsing: {
            storageKey: "wor_parsing_active",
            hasSubOptions: true,
        },
        toggleParsingOptInvertSearch: { storageKey: "wor_parsing_invert_search_active" },

        toggleTelegram: {
            storageKey: "wor_tg_notifications_active",
            hasSubOptions: true,
        },

        toggleChat: {
            storageKey: "wor_chat_active",
            hasSubOptions: true,
        },
        toggleChatOptFastAddressActive: { storageKey: "wor_chat_fast_answers_active" },
    };

    for (let id in toggles) {
        addCheckboxEvents(id, toggles[id].storageKey, toggles[id].hasSubOptions, toggles[id].defaultValue);
    }

    // Функция добавления прослушки
    function addCheckboxEvents(id, storageKey, hasSubOptions, defaultValue = false) {
        let input = document.querySelector('#' + id);
        if (!input) return;

        // Загружаем сохранённое состояние из storage
        chrome.storage.local.get(storageKey, function (data) {
            input.checked = data[storageKey] !== undefined ? data[storageKey] : defaultValue;
        });

        // Добавляем обработчик события
        input.addEventListener("change", function () {
            if ('toggleBandits' === id && input.checked === true) {
                chrome.storage.local.set({ "wor_fight_active": false }, function () {
                    let fightingCheckbox = document.querySelector("#toggleFighting");
                    if (fightingCheckbox) {
                        fightingCheckbox.checked = false;
                    }
                });
            }

            if ('toggleAlchemistry' === id || id === 'toggleMining') {
                chrome.storage.local.set({ "wor_fight_active": input.checked }, function () {
                    let fightingCheckbox = document.querySelector("#toggleFighting");
                    if (fightingCheckbox) {
                        fightingCheckbox.checked = input.checked;
                    }
                });
            }

            chrome.storage.local.set({ [storageKey]: input.checked });
        });

        // Если есть вложенные настройки, добавляем обработчик клика для кнопки в HTML
        if (hasSubOptions) {
            let toggleWrapper = document.querySelector("#" + id + 'Wrapper');
            let optionWrapper = document.querySelector("#" + id + 'OptionsWrapper');

            let expandButton = toggleWrapper.querySelector(".toggle-title"); // Берём кнопку из HTML
            let buttonName = expandButton.textContent; // Сражение ▼

            if (expandButton) {
                optionWrapper.style.display = "none"; // Изначально скрыто

                expandButton.addEventListener("click", function () {
                    if (optionWrapper.style.display === "none" || optionWrapper.style.display === "") {
                        optionWrapper.style.display = "block";
                        expandButton.textContent = buttonName.slice(0, -1) + "▲";
                    } else {
                        optionWrapper.style.display = "none";
                        expandButton.textContent = buttonName;
                    }
                });
            }
        }
    }
}

async function processMap() {
    // JavaScript
    const icon = document.getElementById('refreshMapHistory');

    icon.addEventListener('click', (e) => {
        e.preventDefault();
        // Целевое действие: очищаем историю
        chrome.storage.local.set({ visitedLocations: {} }, () => {
            // После очистки — запускаем спин
            icon.classList.add('animate');
        });
    });

    icon.addEventListener('animationend', () => {
        // Спин кончился — убираем класс анимации
        icon.classList.remove('animate');
        // Меняем символ на галочку
        icon.textContent = '✓';
        icon.setAttribute('aria-label', 'Готово');
        icon.title = 'Готово';
        // Через секунду возвращаем назад
        setTimeout(() => {
            icon.textContent = '↻';
            icon.setAttribute('aria-label', 'Сбросить');
            icon.title = 'Сбросить';
        }, 1000);
    });
}

async function processParsing() {
    let modalId = 'modal_parsing';

    // Инициализация select2 для модалки
    $('#modal-parsing-links, #modal-parsing-targets').select2({
        tags: true,
        width: '100%',
        placeholder: 'Введите значение...',
        tokenSeparators: [',']
    });

    // Открытие модалки
    document.getElementById('toggleParsingOptLinksTargets').addEventListener('click', () => {
        // Очистим и заполним модальные select2 значениями из storage
        chrome.storage.local.get(['wor_parsing_links', 'wor_parsing_targets'], (data) => {
            const links = data.wor_parsing_links || [];
            const targets = data.wor_parsing_targets || [];

            const $links = $('#modal-parsing-links').empty();
            links.forEach(item => {
                const option = new Option(item, item, true, true);
                $links.append(option);
            });
            $links.trigger('change');

            const $targets = $('#modal-parsing-targets').empty();
            targets.forEach(item => {
                const option = new Option(item, item, true, true);
                $targets.append(option);
            });
            $targets.trigger('change');
            openModal(modalId);
        });
    });

    // Сохранение
    document.getElementById('modal-parsing-save').addEventListener('click', () => {
        const links = $('#modal-parsing-links').val();
        const targets = $('#modal-parsing-targets').val();

        chrome.storage.local.set({
            wor_parsing_links: links,
            wor_parsing_targets: targets
        });

        closeModal(modalId);
    });

    // Закрытие модалки (крестик)
    document.querySelector('#modal-parsing-close').addEventListener('click', () => {
        closeModal(modalId);
    });
}

async function processChat() {
    let modalId = 'modal_fast_address';

    $('#modal-fast-address-pairs, #modal-fast-answers-pairs').select2({
        tags: true,
        width: '100%',
        tokenSeparators: ['\n'],
        createTag: function (params) {
            const term = params.term.trim();
            const parts = term.split(':');

            // разрешаем только два или три элемента через двоеточие
            if (parts.length === 2 || parts.length === 3) {
                return { id: term, text: term };
            }
            return null;
        }
    });

    // Открытие модалки
    document.getElementById('toggleChatOptFastAddress').addEventListener('click', () => {
        // Очистим и заполним модальные select2 значениями из storage
        chrome.storage.local.get(['wor_chat_fast_address', 'wor_chat_fast_answers'], (data) => {
            const adresses = data.wor_chat_fast_address || [];
            const answers = data.wor_chat_fast_answers || [];

            const $adresses = $('#modal-fast-address-pairs').empty();
            adresses.forEach(item => {
                const option = new Option(item, item, true, true);
                $adresses.append(option);
            });
            $adresses.trigger('change');

            const $answers = $('#modal-fast-answers-pairs').empty();
            answers.forEach(item => {
                const option = new Option(item, item, true, true);
                $answers.append(option);
            });
            $answers.trigger('change');

            openModal(modalId);
        });
    });

    // Сохранение
    document.getElementById('modal-fast-address-save').addEventListener('click', () => {
        const adresses = $('#modal-fast-address-pairs').val();
        const answers = $('#modal-fast-answers-pairs').val();

        chrome.storage.local.set({
            wor_chat_fast_address: adresses,
            wor_chat_fast_answers: answers,
        });

        closeModal(modalId);
    });

    // Закрытие модалки (крестик)
    document.querySelector('#modal-fast-address-close').addEventListener('click', () => {
        closeModal(modalId);
    });
}

function openModal(id) {
    document.getElementById(id).style.display = 'block';
    document.querySelector('body').style.width = '400px';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
    document.querySelector('body').style.width = '220px';
}

async function processFishing() {
    let fishNameSelect = document.getElementById('toggleFishingNeedFish');

    // Загружаем сохраненное значение из chrome.storage.local
    chrome.storage.local.get('wor_fishing_need_fish', (data) => {
        if (data.wor_fishing_need_fish) {
            fishNameSelect.value = data.wor_fishing_need_fish;
        } else {
            fishNameSelect.value = '';
        }
    });

    // Сохраняем новое значение при вводе
    fishNameSelect.addEventListener('change', async (event) => {
        chrome.storage.local.set({ 'wor_fishing_need_fish': event.target.value });
    });
}

async function processInputs() {
    // Определяем настройки переключателей
    const inputs = {
        inputPlayerName: { storageKey: "wor_chat_player_name" },
        inputFightingLevelToSkip: { storageKey: "wor_fight_level_to_skip" },
        inputFightingMaxTrauma: { storageKey: "wor_fight_max_trauma" },
        inputParsingOptTimeout: { storageKey: "wor_parsing_timeout" },
        inputTelegramOptApiKeyCommon: { storageKey: "wor_tg_bot_common_token" },
        inputTelegramOptApiKeyChat: { storageKey: "wor_tg_bot_chat_token" },
        inputTelegramOptChatID: { storageKey: "wor_tg_chat_id" },
        inputCaptchaHost: { storageKey: "wor_captcha_host" },
        inputMapDelay: { storageKey: "wor_map_move_delay" },
        inputReloadDelay: { storageKey: "wor_map_reload_delay" },
    };

    for (const [inputId, { storageKey }] of Object.entries(inputs)) {
        const inputElement = document.getElementById(inputId);
        if (!inputElement) continue;

        // Устанавливаем значение из хранилища
        chrome.storage.local.get(storageKey, (result) => {
            if (result[storageKey] !== undefined) {
                inputElement.value = result[storageKey];
            }
        });


        // Добавляем слушатель изменений
        inputElement.addEventListener("input", () => {
            const value = inputElement.value;

            if (inputElement.id == 'inputMapDelay') {
                if (!inputElement.value) {
                    chrome.storage.local.set({ [storageKey]: "50,100" });
                }

                const regex = /^\d+(,\d+)?$/;
                if (regex.test(inputElement.value)) {
                    inputElement.style.borderColor = 'green';
                    chrome.storage.local.set({ [storageKey]: value });
                } else {
                    inputElement.style.borderColor = 'red';
                }

                return;
            }

            if (inputElement.id == 'inputReloadDelay') {
                if (!inputElement.value) {
                    chrome.storage.local.set({ [storageKey]: "0" });
                }

                const regex = /^\d+(,\d+)?$/;
                if (regex.test(inputElement.value)) {
                    inputElement.style.borderColor = 'green';
                    chrome.storage.local.set({ [storageKey]: value });
                } else {
                    inputElement.style.borderColor = 'red';
                }

                return;
            }

            chrome.storage.local.set({ [storageKey]: value });
        });
    }
}

async function processQuests() {
    const wrapper = document.getElementById('toggleQuestsWrapper');
    const optWrapper = document.getElementById('toggleQuestsOptionsWrapper');
    const expandBtn = wrapper.querySelector('.toggle-title');
    const btnLabel = expandBtn.textContent;

    optWrapper.style.display = 'none';
    expandBtn.addEventListener('click', () => {
        const isHidden = optWrapper.style.display === 'none' || optWrapper.style.display === '';
        optWrapper.style.display = isHidden ? 'block' : 'none';
        expandBtn.textContent = isHidden ? btnLabel.slice(0, -1) + '▲' : btnLabel;
    });

    document.getElementById('btnQuestWarlock').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.tabs.sendMessage(tab.id, { action: 'startWarlockQuestRun' });
    });
}

async function processFightingBossesModal() {
    const modalId = 'modal-fighting-bosses';

    const BOSS_NAMES = [
        'Единорог',
        'Голем',
        'Тигр',
        'Крокодил',
        'Зеленый дракон',
        'Рыцарь смерти',
        'Орк',
        'Красный дракон',
        'Кристальный дракон',
        'Песчаный червь',
        'Минотавр',
        'Цербер',
        'Страж руин',
    ];

    // Инициализация select2
    const $select = $('#modal-fighting-not-to-fight').select2({
        tags: true,
        width: '100%',
        placeholder: 'Введите значение...',
        tokenSeparators: [','],
        data: BOSS_NAMES.map(name => ({ id: name, text: name }))
    });

    // Открытие модалки
    document.getElementById('toggleFightingOptNotToFight').addEventListener('click', async () => {
        let data = await chrome.storage.local.get(['wor_fight_not_to_fight']);
        const selectedBosses = data.wor_fight_not_to_fight || [];

        $select.val(null).trigger('change'); // сброс

        selectedBosses.forEach(name => {
            // Если значения нет в списке — добавим как кастомное
            if ($select.find(`option[value="${name}"]`).length === 0) {
                const newOption = new Option(name, name, true, true);
                $select.append(newOption);
            } else {
                $select.find(`option[value="${name}"]`).prop('selected', true);
            }
        });

        $select.trigger('change');

        openModal(modalId);
    });

    // Сохранение
    document.getElementById('modal-fighting-not-to-fight-save').addEventListener('click', () => {
        const bosses = $('#modal-fighting-not-to-fight').val() || [];

        chrome.storage.local.set({
            wor_fight_not_to_fight: bosses,
        });

        closeModal(modalId);
    });

    // Закрытие модалки (крестик)
    document.getElementById('modal-fighting-not-to-fight-close').addEventListener('click', () => {
        closeModal(modalId);
    });
}