start();

async function start() {
    let access = await chrome.storage.local.get(["wor_moving_active"]);

    if (!access) {
        return;
    }

    document.addEventListener("keydown", function (event) {
        if (!event.code.includes("Numpad")) {
            return;
        }
        // Находим клетку, где стоит персонаж
        let playerCell = document.querySelector("td[align=center]").querySelector('div');

        if (!playerCell) return;
        let upperRow = playerCell.parentElement.parentElement.previousElementSibling;
        let downRow = playerCell.parentElement.parentElement.nextElementSibling;

        switch (event.code) {

            case 'Numpad4': // Влево
                id = parseInt(playerCell.id.substring(1), 10) - 1;
                playerCell.parentElement.parentElement.querySelector(`#r${id}`).click();
                break;
            case 'Numpad6': // Вправо
                id = parseInt(playerCell.id.substring(1), 10) + 1;
                playerCell.parentElement.parentElement.querySelector(`#r${id}`).click();
                break;


            case 'Numpad8': // Вверх
                let idUp = parseInt(upperRow.querySelector(":nth-child(3) > a").id.substring(1), 10);
                upperRow.querySelector(`#r${idUp}`).click();
                break;

            case 'Numpad7': // Вверх-влево
                let idUpLeft = parseInt(upperRow.querySelector(":nth-child(3) > a").id.substring(1), 10) - 1;
                upperRow.querySelector(`#r${idUpLeft}`).click();
                break;
            case 'Numpad9': // Вверх-вправо
                let idUpRight = parseInt(upperRow.querySelector(":nth-child(3) > a").id.substring(1), 10) + 1;
                upperRow.querySelector(`#r${idUpRight}`).click();
                break;

            case 'Numpad2': // Вниз
                let idDown = parseInt(downRow.querySelector(":nth-child(3) > a").id.substring(1), 10);
                downRow.querySelector(`#r${idDown}`).click();
                break;
            case 'Numpad1': // Вниз-влево
                let idDownLeft = parseInt(downRow.querySelector(":nth-child(3) > a").id.substring(1), 10) - 1;
                downRow.querySelector(`#r${idDownLeft}`).click();
                break;
            case 'Numpad3': // Вниз-вправо
                let idDownRight = parseInt(downRow.querySelector(":nth-child(3) > a").id.substring(1), 10) + 1;
                downRow.querySelector(`#r${idDownRight}`).click();
                break;
        }
    });
}

