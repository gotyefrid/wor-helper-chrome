document.addEventListener("DOMContentLoaded", async function () {
    // Обработчик чекбоксов
    processCheckboxes();
    processInputs();

    // Обработчик кнопки "Объединить"
    processMergeButton();

    // Обработчики парсинга
    processParsing();

    // Обработчик рыбалки
    processFishing();

    // Обработчик выбора боссов
    processFightingBossesModal();
});

async function processCheckboxes() {
    // Определяем настройки переключателей
    const toggles = {
        toggleFishing: {
            storageKey: "wor_fishing_active",
            hasSubOptions: true,
        },
        toggleAlchemistry: { storageKey: "wor_chemistry_active" },
        toggleMoving: { storageKey: "wor_moving_active" },
        toggleCaptcha: {
            storageKey: "wor_captcha_active",
            hasSubOptions: true,
        },
        toggleMapHistory: { storageKey: "wor_maphistory_active" },
        toggleLog: { storageKey: "wor_log_active" },

        toggleFighting: {
            storageKey: "wor_fight_active",
            hasSubOptions: true,
        },
        toggleFightingGiveUp: { storageKey: "wor_fight_give_up_active", },
        toggleFightingPotHP: { storageKey: "wor_fight_pot_hp_active", },
        toggleFightingPotMP: { storageKey: "wor_fight_pot_mp_active", },
        toggleFightingCheckTrauma: { storageKey: "wor_fight_check_trauma", },

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
    };

    for (let id in toggles) {
        addCheckboxEvents(id, toggles[id].storageKey, toggles[id].hasSubOptions);
    }

    // Функция добавления прослушки
    function addCheckboxEvents(id, storageKey, hasSubOptions) {
        let input = document.querySelector('#' + id);
        if (!input) return;

        // Загружаем сохранённое состояние из storage
        chrome.storage.local.get(storageKey, function (data) {
            input.checked = data[storageKey] || false;
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

            if ('toggleMapHistory' === id) {
                chrome.storage.local.set({ ['visitedLocations']: {} });
            }
            if ('toggleAlchemistry' === id) {
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

async function processMergeButton() {
    document.getElementById("mergeButton").addEventListener("click", async () => {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            console.error("Не найдена активная вкладка!");
            return;
        }

        console.log("Отправляем сообщение в content script");
        chrome.tabs.sendMessage(tab.id, { action: "mergeContent" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка при отправке сообщения:", chrome.runtime.lastError.message);
            } else {
                console.log("Ответ от content script:", response);
            }
        });
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
            chrome.storage.local.set({ [storageKey]: value });
        });
    }
}

async function processFightingBossesModal() {
    let modalId = 'modal-fighting-bosses';

    // Инициализация select2 для модалки
    let select = $('#modal-fighting-bosses-to-fight').select2({
        tags: true,
        width: '100%',
        placeholder: 'Введите значение...',
        tokenSeparators: [',']
    });

    // Открытие модалки
    document.getElementById('toggleFightingOptBossesToFight').addEventListener('click', async () => {
        let data = await chrome.storage.local.get(['wor_fighting_bosses_to_fight']);
        const bosses = data.wor_fighting_bosses_to_fight || [];

        const $bosses = select.empty();
        bosses.forEach(item => {
            const option = new Option(item, item, true, true);
            $bosses.append(option);
        });

        $bosses.trigger('change');

        openModal(modalId);
    });

    // Сохранение
    document.getElementById('modal-fighting-bosses-save').addEventListener('click', () => {
        const bosses = $('#modal-fighting-bosses-to-fight').val();

        chrome.storage.local.set({
            wor_fighting_bosses_to_fight: bosses,
        });

        closeModal(modalId);
    });

    // Закрытие модалки (крестик)
    document.querySelector('#modal-fighting-bosses-close').addEventListener('click', () => {
        closeModal(modalId);
    });
}