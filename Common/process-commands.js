(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    while (true) {
        try {
            // Отправка сообщений из чата в Telegram
            let command = await CommonHelper.getTelegramUpdates('common');

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
            CommonHelper.turnCaptcha(false);
            CommonHelper.sendTelegramMessage('Выполнено, выключено всё.', 'common');
            CommonHelper.reloadPage();
            break;
        case '/start_chemistry':
            CommonHelper.log('Пришла команда включить алхимию');
            CommonHelper.turnAlchemistry(true);
            CommonHelper.turnFighting(true);
            CommonHelper.sendTelegramMessage('Выполнено', 'common');
            CommonHelper.reloadPage();
            break;
        case '/start_captcha':
            CommonHelper.log('Пришла команда включить капчу');
            CommonHelper.turnCaptcha(true);
            CommonHelper.sendTelegramMessage('Выполнено', 'common');
            CommonHelper.reloadPage();
            break;
        case '/start_fishing':
            CommonHelper.log('Пришла команда включить рыбалку');
            CommonHelper.turnFishing(true);
            CommonHelper.sendTelegramMessage('Выполнено', 'common');
            CommonHelper.reloadPage();
            break;
        case '/start_fighting':
            CommonHelper.log('Пришла команда включить сражение');
            CommonHelper.turnFighting(true);
            CommonHelper.sendTelegramMessage('Выполнено', 'common');
            CommonHelper.reloadPage();
            break;
        case '/refresh_page':
            CommonHelper.log('Пришла команда перезагрузить страницу');
            CommonHelper.sendTelegramMessage('Выполнено', 'common');
            CommonHelper.reloadPage();
            break;
        case '/refresh_commands_list':
            CommonHelper.log('Пришла команда перезагрузить страницу');
            CommonHelper.setTelegramBotCommands('common');
            CommonHelper.sendTelegramMessage('Выполнено', 'common');
            CommonHelper.reloadPage();
            break;
        case '/to_exit_url':
            CommonHelper.log('Пришла команда перейти на URL сохранённый');
            let exitUrl = await CommonHelper.getExtStorage('wor_fight_exit_url') || null;

            if (exitUrl) {
                document.location = exitUrl;
                return;
            }

            CommonHelper.sendTelegramMessage('Ссылка редиректа не назначена', 'common');
            break;
        default:
    }

}
