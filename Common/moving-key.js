start();

async function start() {
    let access = await chrome.storage.local.get(["wor_moving_active"]);

    if (access.wor_moving_active !== true || document.querySelector('[type=text], textarea')) {
        return;
    }

    document.addEventListener("keydown", function (event) {

        if (event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }
        try {
            try {
                var playerCell = document.querySelector('.map-cell:empty');
            } catch (error) {
            }

            switch (event.code) {
                case 'KeyA': // Влево
                    try {
                        playerCell.previousElementSibling.querySelector('a').click();
                    } catch (error) {
                        [...document.querySelectorAll('a')].find(s => s.textContent.includes("влево")).click();
                    }

                    break;
                case 'KeyD': // Вправо
                    try {
                        playerCell.nextElementSibling.querySelector('a').click();
                    } catch (error) {
                        [...document.querySelectorAll('a')].find(s => s.textContent.includes("вправо")).click();
                    }
                    break;
                case 'KeyW': // Вверх
                    try {
                        const prW = playerCell.getBoundingClientRect();
                        [...document.querySelectorAll('.map-cell')].find(cell => {
                            const r = cell.getBoundingClientRect();
                            return Math.abs(r.left + r.width / 2 - (prW.left + prW.width / 2)) < prW.width * 0.5 &&
                                   Math.abs(r.top + r.height / 2 - (prW.top - prW.height / 2)) < prW.height * 0.5;
                        }).querySelector('a').click();
                    } catch (error) {
                        [...document.querySelectorAll('a')].find(s => s.textContent.includes("вверх")).click();
                    }

                    break;
                case 'KeyQ': // Вверх-влево
                    try {
                        const prQ = playerCell.getBoundingClientRect();
                        [...document.querySelectorAll('.map-cell')].find(cell => {
                            const r = cell.getBoundingClientRect();
                            return Math.abs(r.left + r.width / 2 - (prQ.left - prQ.width / 2)) < prQ.width * 0.5 &&
                                   Math.abs(r.top + r.height / 2 - (prQ.top - prQ.height / 2)) < prQ.height * 0.5;
                        }).querySelector('a').click();
                    } catch (error) {}
                    break;
                case 'KeyE': // Вверх-вправо
                    try {
                        const prE = playerCell.getBoundingClientRect();
                        [...document.querySelectorAll('.map-cell')].find(cell => {
                            const r = cell.getBoundingClientRect();
                            return Math.abs(r.left + r.width / 2 - (prE.left + prE.width * 1.5)) < prE.width * 0.5 &&
                                   Math.abs(r.top + r.height / 2 - (prE.top - prE.height / 2)) < prE.height * 0.5;
                        }).querySelector('a').click();
                    } catch (error) {}
                    break;
                case 'KeyS': // Вниз
                    try {
                        const prS = playerCell.getBoundingClientRect();
                        [...document.querySelectorAll('.map-cell')].find(cell => {
                            const r = cell.getBoundingClientRect();
                            return Math.abs(r.left + r.width / 2 - (prS.left + prS.width / 2)) < prS.width * 0.5 &&
                                   Math.abs(r.top + r.height / 2 - (prS.top + prS.height * 1.5)) < prS.height * 0.5;
                        }).querySelector('a').click();
                    } catch (error) {
                        [...document.querySelectorAll('a')].find(s => s.textContent.includes("вниз")).click();
                    }
                    break;
                case 'KeyZ': // Вниз-влево
                    try {
                        const prZ = playerCell.getBoundingClientRect();
                        [...document.querySelectorAll('.map-cell')].find(cell => {
                            const r = cell.getBoundingClientRect();
                            return Math.abs(r.left + r.width / 2 - (prZ.left - prZ.width / 2)) < prZ.width * 0.5 &&
                                   Math.abs(r.top + r.height / 2 - (prZ.top + prZ.height * 1.5)) < prZ.height * 0.5;
                        }).querySelector('a').click();
                    } catch (error) {}
                    break;
                case 'KeyC': // Вниз-вправо
                    try {
                        const prC = playerCell.getBoundingClientRect();
                        [...document.querySelectorAll('.map-cell')].find(cell => {
                            const r = cell.getBoundingClientRect();
                            return Math.abs(r.left + r.width / 2 - (prC.left + prC.width * 1.5)) < prC.width * 0.5 &&
                                   Math.abs(r.top + r.height / 2 - (prC.top + prC.height * 1.5)) < prC.height * 0.5;
                        }).querySelector('a').click();
                    } catch (error) {}
                    break;
                case 'KeyR': // Сдаться
                    try {
                        document.querySelector("a[href*=killme]").click()
                        return;
                    } catch { }

                    document.location = '/wap/teritory.php';
                    break;
                case 'Space': // Ударить
                    try {
                        document.querySelector("form").submit();
                        return;
                    } catch { }

                    document.location = '/wap/teritory.php';
                    break;
                case 'KeyF': // Ударить физой
                    try {
                        let form = document.querySelector("form");
                        let type = form.querySelector('[name=udartype]')
                        type.value = "1";
                        document.querySelector("form").submit();
                        return;
                    } catch {
                    }

                    document.location = '/wap/teritory.php';
                    break;
                case 'KeyM': // Остановить проход карты
                    try {
                        CommonHelper.setExtStorage('wor_map_walk_all_map_active', {active: false});

                        CommonHelper.reloadPage();
                        return;
                    } catch {
                    }

                    document.location = '/wap/teritory.php';
                    break;
            }
        } catch (error) {
            // Получаем сообщение об ошибке
            let errorMessage = error.message;

            // Получаем стек вызовов (где произошла ошибка)
            let stackLines = error.stack.split("\n");

            // Вытаскиваем строку с файлом и номером строки
            let locationInfo = stackLines[1]?.trim() || "Неизвестное место";

            // Логируем всё сразу
            console.log(`Ошибка: ${errorMessage} | Местоположение: ${locationInfo}`, false);
        }
    });
}