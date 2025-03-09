document.addEventListener("DOMContentLoaded", async function () {
    const toggleContainer = document.body;

    // Определяем настройки переключателей
    const toggles = {
        toggleFishing: { name: "Рыбалка", storageKey: "wor_fishing_active" },
        toggleAlchemistry: { name: "Алхимия", storageKey: "wor_alchemistry_active" },
        toggleMoving: { name: "Клавамув", storageKey: "wor_moving_active" },
        toggleCaptcha: { name: "Капча", storageKey: "wor_captcha_active" },
        toggleMapHistory: { name: "История карты", storageKey: "wor_maphistory_active" },
        toggleLog: { name: "Лог", storageKey: "wor_log_active" }
    };

    // Функция создания переключателя
    function createToggle(id, label, storageKey) {
        let wrapper = document.createElement("div");
        wrapper.classList.add("toggle-wrapper");

        let title = document.createElement("span");
        title.textContent = label;
        title.classList.add("toggle-title");

        let labelElem = document.createElement("label");
        labelElem.classList.add("switch");

        let input = document.createElement("input");
        input.type = "checkbox";
        input.id = id;

        let span = document.createElement("span");
        span.classList.add("slider", "round");

        labelElem.appendChild(input);
        labelElem.appendChild(span);

        wrapper.appendChild(title);
        wrapper.appendChild(labelElem);

        toggleContainer.appendChild(wrapper);

        // Разделитель
        let divider = document.createElement("hr");
        divider.classList.add("divider");
        toggleContainer.appendChild(divider);

        // Загружаем сохранённое состояние из storage
        chrome.storage.local.get(storageKey, function (data) {
            input.checked = data[storageKey] || false;
        });

        // Добавляем обработчик события
        input.addEventListener("change", function () {
            if ('toggleMapHistory' === id) {
                chrome.storage.local.set({ ['visitedLocations']: {} });
            }
            chrome.storage.local.set({ [storageKey]: input.checked });
        });
    }

    // Генерируем все переключатели динамически
    for (let id in toggles) {
        createToggle(id, toggles[id].name, toggles[id].storageKey);
    }
});
