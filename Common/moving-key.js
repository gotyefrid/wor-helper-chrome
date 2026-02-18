/* global chrome, CommonHelper */

start().catch(console.error);

function findCellByOffset(playerCell, dx, dy) {
    const pr = playerCell.getBoundingClientRect();
    return [...document.querySelectorAll('.map-cell')].find(cell => {
        const r = cell.getBoundingClientRect();
        return Math.abs(r.left + r.width / 2 - (pr.left + pr.width * (0.5 + dx))) < pr.width * 0.5
            && Math.abs(r.top + r.height / 2 - (pr.top + pr.height * (0.5 + dy))) < pr.height * 0.5;
    });
}

async function start() {
    let access = await chrome.storage.local.get(["wor_moving_active"]);

    // noinspection JSUnresolvedVariable
    if (access.wor_moving_active !== true || document.querySelector('[type=text], textarea')) {
        return;
    }

    document.addEventListener("keydown", function (event) {

        if (event.ctrlKey || event.altKey || event.metaKey) {
            return;
        }
        try {
            const playerCell = document.querySelector('.map-cell:empty');

            switch (event.code) {
                case 'KeyA': // Влево
                    try {
                        document.location.href = playerCell.previousElementSibling.querySelector('a').href;
                    } catch (error) {
                        [...document.querySelectorAll('a')].find(s => s.textContent.includes("влево"))?.click();
                    }
                    break;
                case 'KeyD': // Вправо
                    try {
                        document.location.href = playerCell.nextElementSibling.querySelector('a').href;
                    } catch (error) {
                        [...document.querySelectorAll('a')].find(s => s.textContent.includes("вправо"))?.click();
                    }
                    break;
                case 'KeyW': // Вверх
                    try {
                        document.location.href = findCellByOffset(playerCell, 0, -1).querySelector('a').href;
                    } catch (error) {
                        [...document.querySelectorAll('a')].find(s => s.textContent.includes("вверх"))?.click();
                    }
                    break;
                case 'KeyS': // Вниз
                    try {
                        document.location.href = findCellByOffset(playerCell, 0, 1).querySelector('a').href;
                    } catch (error) {
                        [...document.querySelectorAll('a')].find(s => s.textContent.includes("вниз"))?.click();
                    }
                    break;
                case 'KeyQ': // Вверх-влево
                    try {
                        document.location.href = findCellByOffset(playerCell, -1, -1).querySelector('a').href;
                    } catch (error) {}
                    break;
                case 'KeyE': // Вверх-вправо
                    try {
                        document.location.href = findCellByOffset(playerCell, 1, -1).querySelector('a').href;
                    } catch (error) {}
                    break;
                case 'KeyZ': // Вниз-влево
                    try {
                        document.location.href = findCellByOffset(playerCell, -1, 1).querySelector('a').href;
                    } catch (error) {}
                    break;
                case 'KeyC': // Вниз-вправо
                    try {
                        document.location.href = findCellByOffset(playerCell, 1, 1).querySelector('a').href;
                    } catch (error) {}
                    break;
                case 'KeyR': // Сдаться
                    try {
                        document.querySelector("a[href*=killme]").click()
                        return;
                    } catch {
                    }

                    document.location = '/wap/teritory.php';
                    break;
                case 'Space': // Ударить
                    try {
                        document.querySelector("form").submit();
                        return;
                    } catch {
                    }

                    document.location = '/wap/teritory.php';
                    break;
                case 'KeyF': // Ударить физой
                    try {
                        let form = document.querySelector("form");
                        form.querySelector('[name=udartype]').value = "1";
                        form.submit();
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
            let errorMessage = error.message;
            let stackLines = error.stack.split("\n");
            let locationInfo = stackLines[1]?.trim() || "Неизвестное место";
            console.log(`Ошибка: ${errorMessage} | Местоположение: ${locationInfo}`, false);
        }
    });
}
