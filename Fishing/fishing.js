let fishingTimeout; // Глобальная переменная для хранения таймера
fishing();

async function fishing() {
    const result = await chrome.storage.local.get(["wor_fishing_active"]);

    if (fishingTimeout) {
        clearTimeout(fishingTimeout);
    } // Очищаем предыдущий таймер перед запуском нового

    async function runFishingLoop() {
        if (!result.wor_fishing_active) {
            CommonHelper.log(`Бот рыбалки отключен`);
            return; // Если бот выключен или URL не соответствует разрешённым страницам, выходим
        }

        // значит экран выбор локации
        if (document.querySelector('.btninv')) {
            CommonHelper.log('Выбираем место рыбалки');
            await CommonHelper.delay(CommonHelper.getRandomNumber(1000, 2000));
            await processSetFishingLocation();
        } else {
            CommonHelper.log('Ждем загрузку страницы');
            await CommonHelper.delay(CommonHelper.getRandomNumber(500, 1000)); // ждем подгрузки аякс
            showTimeRequired();

            await processGetFishButton();
        }

        // Запускаем новый вызов функции через случайный интервал, но ТОЛЬКО после завершения всех действий
        let randomDelay = CommonHelper.getRandomNumber(1000, 5000);
        fishingTimeout = setTimeout(runFishingLoop, randomDelay);
    }

    // Первый вызов
    runFishingLoop();
}

function showTimeRequired() {
    // Находим <span> с id="mf"
    const mfElement = document.getElementById("mf");

    if (mfElement) {
        let nnValue = null;

        // Ищем <script>, содержащий "if (sec == NN)" (оптимизированный поиск)
        const script = [...document.scripts].find(s => s.textContent.includes("if (sec =="));

        if (script) {
            // Извлекаем NN быстрее через прямое регулярное выражение
            const match = script.textContent.match(/if \(sec == (\d+)\)/);
            if (match) {
                nnValue = match[1]; // Получаем NN
            }
        }

        if (nnValue !== null) {
            // Создаем новый <span> и вставляем после #mf (без лишних операций)
            mfElement.insertAdjacentHTML("afterend", `<span> из ${nnValue}</span>`);
        }
    }
}

async function processGetFishButton() {
    CommonHelper.log("Ожидаем появление кнопки 'Подсечь!'...");
    CommonHelper.setFightExitUrl(document.location.href);

    return new Promise((resolve) => {
        // Выбираем элемент по ID
        const targetNode = document.getElementById("bp");

        // Создаем новый объект наблюдателя
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                if (mutation.type === "characterData" || mutation.type === "childList") {
                    (async () => {
                        let getButton = [...document.querySelectorAll("strong")]
                            .find(strong => strong.innerText.includes("Подсечь"));

                        if (getButton) {
                            CommonHelper.log("Подсекаем!");
                            await CommonHelper.delay(CommonHelper.getRandomNumber(500, 1000)); // Ждем перед нажатием
                            observer.disconnect(); // Останавливаем наблюдение
                            getButton.click();

                            resolve(); // Завершаем `processGetFishButton`
                        }
                    })();
                }
            }
        });

        // Настройки для отслеживания изменений
        const config = {characterData: true, childList: true, subtree: true};

        // Запускаем наблюдение
        observer.observe(targetNode, config);
    });
}

async function processSetFishingLocation() {
    // Получаем все кнопки локаций
    let placeButtons = [...document.querySelectorAll(".btninv")];

    if (placeButtons.length === 0) {
        CommonHelper.log("Не найдено ни одной кнопки выбора локации!", false);
        CommonHelper.sendTelegramMessage("Не найдено ни одной кнопки выбора локации!");
        return;
    }

    // Получаем последнюю сохранённую локацию
    let savedLocation = await CommonHelper.getExtStorage("wor_fishing_last_location_index");
    savedLocation = savedLocation !== null ? Number(savedLocation) : null; // Приводим к числу, если есть

    // Получаем последний отчёт
    let lastFishReport = await getLastFishingReport();

    let locationIndex; // Индекс, куда пойдём

    if (lastFishReport) {
        CommonHelper.log("Есть последний отчёт", false);
        let fishNameNeed = await CommonHelper.getExtStorage('wor_fishing_need_fish') ?? '';

        // Если нужная рыба или неудачная подсечка
        if (lastFishReport.toLowerCase().includes(fishNameNeed.toLowerCase()) || lastFishReport.toLowerCase().includes("неудачно")) {
            if (lastFishReport.toLowerCase().includes(fishNameNeed.toLowerCase())) {
                CommonHelper.log("Поймали искомую рыбу: " + fishNameNeed, false);
            } else {
                CommonHelper.log("Сорвалась рыбка", false);
            }

            if (savedLocation !== null) {
                CommonHelper.log("Идём на сохранённую локацию", false);
                locationIndex = savedLocation;
            }
        } else {
            // Если подсекли ненужную рыбу
            CommonHelper.log("Подсекли рыбу, которую не хотим", false);
            if (savedLocation !== null) {
                // Запоминаем исходные индексы кнопок
                let indexedButtons = placeButtons.map((button, index) => ({index, button}));

                // log(
                //     "Была сохранённая локация (" + indexedButtons.find(b => b.index === savedLocation)?.button.innerText.trim() + "), туда не идём.",
                //     false
                // );

                // Убираем сохранённую локацию
                // indexedButtons = indexedButtons.filter(b => b.index !== savedLocation);

                // Если есть доступные локации, выбираем случайную из оставшихся
                if (indexedButtons.length > 0) {
                    let randomIndex = Math.floor(Math.random() * indexedButtons.length);
                    locationIndex = indexedButtons[randomIndex].index; // Берём оригинальный индекс
                } else {
                    CommonHelper.log("Не осталось доступных локаций после удаления предыдущей!", false);
                    return;
                }
            } else {
                CommonHelper.log("Не нашли сохранённой локации. Идём в рандомную локацию", false);
                locationIndex = Math.floor(Math.random() * placeButtons.length);
            }
        }
    } else {
        if (savedLocation !== null) {
            CommonHelper.log("Отчёта не нашли, но есть предыдущая локация. Идём туда", false);
            locationIndex = savedLocation;
        } else {
            CommonHelper.log("Идём в рандомную локацию", false);
            locationIndex = Math.floor(Math.random() * placeButtons.length);
        }
    }

    let button = placeButtons.length > 0 ? placeButtons[locationIndex] : false;

    if (button) {
        CommonHelper.log("Идём в локацию: " + button.innerText.trim(), false);
        CommonHelper.setExtStorage("wor_fishing_last_location_index", locationIndex);
        button.click();
        return;
    }

    CommonHelper.log("Почему-то не нашлись кнопки выбора локации");
    CommonHelper.sendTelegramMessage("Почему-то не нашлись кнопки выбора локации");
}


async function getLastFishingReport() {
    // Получаем все элементы с классом "svet"
    let spans = [...document.querySelectorAll('.header_mes span.svet')];

    // Проверяем, есть ли вообще такие элементы
    if (!spans) {
        return false;
    }

    // Ищем последний элемент с нужной строкой
    let targetSpan = spans.find(span => span.innerText.includes('выловили') || span.innerText.includes('неудачно'));

    if (!targetSpan) {
        return false;
    }

    let text = targetSpan.innerText;

    CommonHelper.log('Отчет рыбалки: ' + text);

    return text;
}
