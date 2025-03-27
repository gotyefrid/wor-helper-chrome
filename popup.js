document.addEventListener("DOMContentLoaded", async function () {
    // Обработчик чекбоксов
    processCheckboxes();
    processPlayerName();

    // Обработчик ввода уровня
    processFightingLevelToSkipInput();
    processBanditsLevelToSkipInput();

    // Обработчик кнопки "Объединить"
    processMergeButton();

    processParsing();
    processFishing();
    processTelegram();
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
        toggleCaptcha: { storageKey: "wor_captcha_active" },
        toggleMapHistory: { storageKey: "wor_maphistory_active" },
        toggleLog: { storageKey: "wor_log_active" },

        toggleFighting: {
            storageKey: "wor_fight_active",
            hasSubOptions: true,
        },
        toggleFightingGiveUp: { storageKey: "wor_fight_give_up_active", },
        toggleFightingPotHP: { storageKey: "wor_fight_pot_hp_active", },
        toggleFightingPotMP: { storageKey: "wor_fight_pot_mp_active", },

        toggleBandits: {
            storageKey: "wor_bandits_active",
            hasSubOptions: true,
        },
        toggleBanditsOptPotHP: { storageKey: "wor_bandits_pot_hp_active" },
        toggleBanditsOptPotMP: { storageKey: "wor_bandits_pot_mp_active" },

        toggleParsing: {
            storageKey: "wor_parsing_active",
            hasSubOptions: true,
        },

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

async function processFightingLevelToSkipInput() {
    let levelToSkipInput = document.getElementById('inputFightingLevelToSkip');

    // Загружаем сохраненное значение из chrome.storage.local
    chrome.storage.local.get('wor_fight_level_to_skip', (data) => {
        if (data.wor_fight_level_to_skip) {
            levelToSkipInput.value = data.wor_fight_level_to_skip;
        } else {
            levelToSkipInput.value = 0;
        }
    });

    // Сохраняем новое значение при вводе
    levelToSkipInput.addEventListener('input', async (event) => {
        let value = event.target.value.replace(/\D/g, "").slice(0, 2); // Только числа, не более 2 символов
        event.target.value = value; // Принудительно применяем отфильтрованное значение
        chrome.storage.local.set({ 'wor_fight_level_to_skip': value });
    });
}

async function processBanditsLevelToSkipInput() {
    let levelToSkipInput = document.getElementById('inputBanditsOptLevelToSkip');

    // Загружаем сохраненное значение из chrome.storage.local
    chrome.storage.local.get('wor_bandits_level_to_skip', (data) => {
        if (data.wor_bandits_level_to_skip) {
            levelToSkipInput.value = data.wor_bandits_level_to_skip;
        } else {
            levelToSkipInput.value = 0;
        }
    });

    // Сохраняем новое значение при вводе
    levelToSkipInput.addEventListener('input', async (event) => {
        let value = event.target.value.replace(/\D/g, "").slice(0, 2); // Только числа, не более 2 символов
        event.target.value = value; // Принудительно применяем отфильтрованное значение
        chrome.storage.local.set({ 'wor_bandits_level_to_skip': value });
    });
}

async function processParsing() {
    function openModal() {
        document.getElementById('modal').style.display = 'block';
        document.querySelector('body').style.width = '400px';
    }

    function closeModal() {
        document.getElementById('modal').style.display = 'none';
        document.querySelector('body').style.width = '220px';
    }

    // Инициализация select2 для модалки
    $('#modal-links, #modal-targets').select2({
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

            const $links = $('#modal-links').empty();
            links.forEach(item => {
                const option = new Option(item, item, true, true);
                $links.append(option);
            });
            $links.trigger('change');

            const $targets = $('#modal-targets').empty();
            targets.forEach(item => {
                const option = new Option(item, item, true, true);
                $targets.append(option);
            });
            $targets.trigger('change');
            openModal();
        });
    });

    // Сохранение
    document.getElementById('modal-save').addEventListener('click', () => {
        const links = $('#modal-links').val();
        const targets = $('#modal-targets').val();

        chrome.storage.local.set({
            wor_parsing_links: links,
            wor_parsing_targets: targets
        });

        closeModal();
    });

    // Закрытие модалки (крестик)
    document.querySelector('.modal-close').addEventListener('click', () => {
        closeModal();
    });

    let timeoutInput = document.getElementById('inputParsingOptTimeout');

    // Загружаем сохраненное значение из chrome.storage.local
    chrome.storage.local.get('wor_parsing_timeout', (data) => {
        if (data.wor_parsing_timeout) {
            timeoutInput.value = data.wor_parsing_timeout;
        } else {
            timeoutInput.value = 0;
        }
    });

    // Сохраняем новое значение при вводе
    timeoutInput.addEventListener('input', async (event) => {
        let value = event.target.value.replace(/\D/g, "").slice(0, 2); // Только числа, не более 2 символов
        event.target.value = value; // Принудительно применяем отфильтрованное значение
        chrome.storage.local.set({ 'wor_parsing_timeout': value });
    });
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

async function processTelegram() {
    const apiKeyCommonInput = document.getElementById('inputTelegramOptApiKeyCommon');
    const chatIdInput = document.getElementById('inputTelegramOptChatID');
    const apiKeyChatInput = document.getElementById('inputTelegramOptApiKeyChat');

    chrome.storage.local.get([
        'wor_tg_bot_common_token',
        'wor_tg_chat_id',
        'wor_tg_bot_chat_token'
    ], (data) => {
        apiKeyCommonInput.value = data.wor_tg_bot_common_token || '';
        chatIdInput.value = data.wor_tg_chat_id || '';
        apiKeyChatInput.value = data.wor_tg_bot_chat_token || '';
    });

    const saveToStorage = (key) => (event) => {
        chrome.storage.local.set({ [key]: event.target.value });
    };

    apiKeyCommonInput.addEventListener('change', saveToStorage('wor_tg_bot_common_token'));
    chatIdInput.addEventListener('change', saveToStorage('wor_tg_chat_id'));
    apiKeyChatInput.addEventListener('change', saveToStorage('wor_tg_bot_chat_token'));
}

async function processPlayerName() {
    const playerName = document.getElementById('inputPlayerName');

    chrome.storage.local.get(['wor_chat_player_name'], (data) => {
        playerName.value = data.wor_chat_player_name || '';
    });

    const saveToStorage = (key) => (event) => {
        chrome.storage.local.set({ [key]: event.target.value });
    };

    playerName.addEventListener('change', saveToStorage('wor_chat_player_name'));
}
