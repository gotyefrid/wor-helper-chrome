class Fishing {
    isFishingPage = false;
    isWaitingFishPage = false;
    isSetLocationPage = false;
    isTerritoryPage = false;
    isMainPage = false;
    isGamePage = false;

    constructor() {
        this.#checkCurrentPage();
    }

    #checkCurrentPage() {
        const fishingPaths = ["/wap/lovit", "/wap/teritory", "/wap/main", "wap/game"];
        this.isFishingPage = fishingPaths.some(path => location.pathname.includes(path));

        if (this.isFishingPage) {
            const zag = [...document.querySelectorAll('.zagolovok')];
            this.isWaitingFishPage = zag.some(div => div.textContent.toLowerCase().includes('удочка закинута'));
            this.isSetLocationPage = zag.some(div => div.textContent.toLowerCase().includes('куда закинуть удочку'));
            this.isTerritoryPage = document.location.pathname.includes("/wap/teritory");
            this.isMainPage = document.location.pathname.includes("/wap/main");;
            this.isGamePage = document.location.pathname.includes("/wap/game");;
        }
    }

    /** Ожидает появления ссылки «Подсечь» и кликает по ней */
    #waitForPodsech() {
        const bp = document.getElementById('bp');
        if (!bp) return Promise.reject(new Error('#bp not found'));

        const isLinkOk = el => el.matches('a[href*="tjanu="]') || el.textContent.toLowerCase().includes('подсечь');

        const ready = [...bp.querySelectorAll('a')].find(isLinkOk);
        if (ready) return Promise.resolve(ready);

        return new Promise(resolve => {
            const observer = new MutationObserver(([{addedNodes}], obs) => {
                for (const node of addedNodes) {
                    if (node.nodeType === 1 && isLinkOk(node)) {
                        obs.disconnect();
                        resolve(node);
                        break;
                    }
                }
            });
            observer.observe(bp, {childList: true});
        });
    }

    /** 🔸 Возвращает Promise, который резолвится,
     *     когда в #msg_box появится .contur с «В бой:»            */
    #waitForBattleMsg() {
        const box = document.getElementById('msg_box');
        if (!box) return Promise.reject(new Error('#msg_box not found'));

        const isBattleMsg = el => el.nodeType === 1 && el.classList.contains('contur') && el.textContent.includes('В бой:');

        // мгновенная проверка
        if ([...box.querySelectorAll('.contur')].some(isBattleMsg)) {
            return Promise.resolve();      // уже есть – резолвим сразу
        }

        return new Promise(resolve => {
            const observer = new MutationObserver(mList => {
                for (const m of mList) {
                    for (const node of m.addedNodes) {
                        if (isBattleMsg(node)) {
                            observer.disconnect();
                            resolve();     // сообщение найдено
                            return;
                        }
                    }
                }
            });
            observer.observe(box, {childList: true, subtree: true});
        });
    }

    async processWaitingFishPage() {
        const bp = document.getElementById('bp');
        if (!bp) return;

        const isWaiting = bp.textContent
            .toLowerCase()
            .includes('рыба игнорирует ваши старания');

        if (isWaiting) {
            CommonHelper.log('Ждём подсечки...');
            // «Подсечь» — кликаем, когда появится
            this.#waitForPodsech()
                .then(async (link) => {
                    await CommonHelper.delay(CommonHelper.getRandomNumber(1000, 1500));
                    await CommonHelper.clickAndWait(link);
                })
                .catch(console.error);


            CommonHelper.log('Ждём кнопки "В бой"');
            // «В бой:» — перезагружаем, когда появится
            this.#waitForBattleMsg()
                .then(async () => {
                    await CommonHelper.reloadPage();
                })
                .catch(console.error);
        } else {
            // Кликаем Подсечь
            await CommonHelper.delay(CommonHelper.getRandomNumber(1000, 1500));
            await CommonHelper.clickAndWait(bp.querySelector('a'));
        }
    }

    async processSetLocationPage() {
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
        let lastFishReport = await this.getLastFishingReport();

        let locationIndex; // Индекс, куда пойдём

        if (lastFishReport) {
            CommonHelper.log("Есть последний отчёт: " + lastFishReport, false);
            let fishNameNeed = await CommonHelper.getExtStorage('wor_fishing_need_fish') ?? '';

            // Если нужная рыба или неудачная подсечка
            if (lastFishReport.toLowerCase().includes(fishNameNeed.toLowerCase())) {
                CommonHelper.log("Поймали искомую рыбу: " + fishNameNeed, false);

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
            await CommonHelper.clickAndWait(button);
            return;
        }

        CommonHelper.log("Почему-то не нашлись кнопки выбора локации");
        CommonHelper.sendTelegramMessage("Почему-то не нашлись кнопки выбора локации");
    }

    async getLastFishingReport() {
        const messages = await CommonHelper.fetchChat();

        if (!messages?.length) {
            return null;
        }

        const firstMatched = messages.find(m => m.text?.includes('Вы подсекли и выловили')      // проверяем подстроку
        );

        return firstMatched?.text ?? null;
    }

    showTimeRequired() {
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
    async processMainAndGamePages() {
        let shouldContinue = await CommonHelper.askWithTimeout('Рыбалка включена, продолжить скрипт?', 5000);

        if (!shouldContinue) return; // Если выбрали "Нет" — прерываем выполнение

        let exitUrl = await CommonHelper.getExtStorage('wor_fight_exit_url');

        if (exitUrl) {
            document.location = exitUrl;
            return;
        }

        let toTerritoryButton = [...document.querySelectorAll('a')].find(text => text.textContent.includes('Природа'));

        if (toTerritoryButton) {
            await CommonHelper.log('Выходим на природу');
            await CommonHelper.clickAndWait(toTerritoryButton);
            return;
        }

        await CommonHelper.sendTelegramMessage('На странице нету ссылки на природу, что-то тут не так:' + document.location.href);
        await CommonHelper.turnFishing(false);
        await CommonHelper.turnFighting(false);
    }

    async processTerritoryPage() {
        let shouldContinue = await CommonHelper.askWithTimeout('Рыбалка включена, продолжить скрипт?', 5000);

        if (!shouldContinue) return; // Если выбрали "Нет" — прерываем выполнение

        let startFishingButton = [...document.querySelectorAll('a')].find(a => a.innerText.toLowerCase().includes('ловить рыбу'));

        if (startFishingButton) {
            await CommonHelper.delay(CommonHelper.getRandomNumber(500, 1500));
            await CommonHelper.clickAndWait(startFishingButton);
            return;
        }

        await CommonHelper.sendTelegramMessage('На странице нету ссылки на Ловить рыбу, что-то тут не так:' + document.location.href);
        await CommonHelper.turnFishing(false);
        await CommonHelper.turnFighting(false);
    }
}
