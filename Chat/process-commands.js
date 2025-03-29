(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }
    
    while (true) {
        try {
            // Отправка сообщений из чата в Telegram
            let command = await CommonHelper.getTelegramUpdates('chat');

            if (command) {
                handleTelegramCommands(command);
            } else {
                CommonHelper.log('Нет новых комманд для выполнения.');
            }

        } catch (err) {
            console.log(err);
        }

        // Ждём 10 секунд перед следующим запуском
        await CommonHelper.delay(10000);
    }
})();

async function handleTelegramCommands(command) {
    let text = command.message;

    switch (text) {
        case '/stop':
            CommonHelper.log('Пришла команда остановить бота');
            CommonHelper.turnAlchemistry(false);
            CommonHelper.turnFighting(false);
            CommonHelper.turnFishing(false);
            CommonHelper.reloadPage();
            break;
        case '/start_chemistry':
            CommonHelper.log('Пришла команда включить алхимию');
            CommonHelper.turnAlchemistry(true);
            CommonHelper.turnFighting(true);
            CommonHelper.reloadPage();
            break;
        case '/start_fishing':
            CommonHelper.log('Пришла команда включить рыбалку');
            CommonHelper.turnFishing(true);
            CommonHelper.reloadPage();
            break;
        case '/start_fighting':
            CommonHelper.log('Пришла команда включить сражение');
            CommonHelper.turnFighting(true);
            CommonHelper.reloadPage();
            break;
        default:
    }

}
