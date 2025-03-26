start();

async function start() {
    let access = await chrome.storage.local.get(["wor_moving_active"]);

    if (!access) {
        return;
    }

    document.addEventListener("keydown", function (event) {
        try {
            var playerCell = document.querySelector("td[align=center]").querySelector('div');
            var upperRow = playerCell.parentElement.parentElement.previousElementSibling;
            var downRow = playerCell.parentElement.parentElement.nextElementSibling;

            switch (event.code) {
                case 'KeyA': // Влево
                    var cellId = parseInt(playerCell.id.substring(1), 10) - 1;
                    playerCell.parentElement.parentElement.querySelector(`#r${id}`).click();
                    break;
                case 'KeyD': // Вправо
                    var id = parseInt(playerCell.id.substring(1), 10) + 1;
                    playerCell.parentElement.parentElement.querySelector(`#r${id}`).click();
                    break;
                case 'KeyW': // Вверх
                    var cellId = parseInt(upperRow.firstElementChild.firstElementChild.id.substring(1), 10) + 2;
                    upperRow.querySelector(`#r${cellId}`).click();
                    break;
                case 'KeyQ': // Вверх-влево
                    var cellId = parseInt(upperRow.firstElementChild.firstElementChild.id.substring(1), 10) + 1;
                    upperRow.querySelector(`#r${cellId}`).click();
                    break;
                case 'KeyE': // Вверх-вправо
                    var cellId = parseInt(upperRow.firstElementChild.firstElementChild.id.substring(1), 10) + 3;
                    upperRow.querySelector(`#r${cellId}`).click();
                    break;
                case 'KeyS': // Вниз
                    var cellId = parseInt(downRow.firstElementChild.firstElementChild.id.substring(1), 10) + 2;
                    downRow.querySelector(`#r${cellId}`).click();
                    break;
                case 'KeyZ': // Вниз-влево
                    var cellId = parseInt(downRow.firstElementChild.firstElementChild.id.substring(1), 10) + 1;
                    downRow.querySelector(`#r${cellId}`).click();
                    break;
                case 'KeyC': // Вниз-вправо
                    var cellId = parseInt(downRow.firstElementChild.firstElementChild.id.substring(1), 10) + 3;
                    downRow.querySelector(`#r${cellId}`).click();
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
            }
        } catch (error) {
            // Получаем сообщение об ошибке
            let errorMessage = error.message;

            // Получаем стек вызовов (где произошла ошибка)
            let stackLines = error.stack.split("\n");

            // Вытаскиваем строку с файлом и номером строки
            let locationInfo = stackLines[1]?.trim() || "Неизвестное место";

            // Логируем всё сразу
            log(`Ошибка: ${errorMessage} | Местоположение: ${locationInfo}`, false);
        }
    });
}

