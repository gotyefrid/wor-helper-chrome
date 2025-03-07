document.addEventListener("DOMContentLoaded", async function () {
    const toggleContainer = document.body; // Контейнер для добавления переключателей

    // Определяем настройки переключателей
    const toggles = {
        toggleFishing: { name: "Рыбалка", storageKey: "wor_fishing_active" },
        toggleMoving: { name: "Клавамув", storageKey: "wor_moving_active" },
        toggleCaptcha: { name: "Капча", storageKey: "wor_captcha_active" },
        toggleMapHistory: { name: "История карты", storageKey: "wor_maphistory_active" },
        toggleLog: { name: "Лог", storageKey: "wor_log_active" }
    };

    // Функция создания переключателя
    function createToggle(id, label, storageKey) {
        let wrapper = document.createElement("div");

        let title = document.createElement("h2");
        title.textContent = label;
        wrapper.appendChild(title);

        let labelElem = document.createElement("label");
        labelElem.classList.add("switch");

        let input = document.createElement("input");
        input.type = "checkbox";
        input.id = id;

        let span = document.createElement("span");
        span.classList.add("slider", "round");

        labelElem.appendChild(input);
        labelElem.appendChild(span);
        wrapper.appendChild(labelElem);

        toggleContainer.appendChild(wrapper);

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
