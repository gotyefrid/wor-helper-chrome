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
            await CommonHelper.log('Пришла команда остановить бота');
            await CommonHelper.turnAlchemistry(false);
            await CommonHelper.turnFighting(false);
            await CommonHelper.turnFishing(false);
            await CommonHelper.turnCaptcha(false);
            await CommonHelper.turnBandits(false);
            await CommonHelper.sendTelegramMessage('Выполнено, выключено всё.', 'common');
            await CommonHelper.reloadPage();
            break;
        case '/start_chemistry':
            await CommonHelper.log('Пришла команда включить алхимию');
            await CommonHelper.turnAlchemistry(true);
            await CommonHelper.turnFighting(true);
            await CommonHelper.sendTelegramMessage('Алхимия включена', 'common');
            await CommonHelper.reloadPage();
            break;
        case '/start_captcha':
            await CommonHelper.log('Пришла команда включить капчу');
            await CommonHelper.turnCaptcha(true);
            await CommonHelper.sendTelegramMessage('Каптча включена', 'common');
            await CommonHelper.reloadPage();
            break;
        case '/start_fishing':
            await CommonHelper.log('Пришла команда включить рыбалку');
            await CommonHelper.turnFishing(true);
            await CommonHelper.sendTelegramMessage('Рыбалка включена', 'common');
            await CommonHelper.reloadPage();
            break;
        case '/start_fighting':
            await CommonHelper.log('Пришла команда включить сражение');
            await CommonHelper.turnFighting(true);
            await CommonHelper.sendTelegramMessage('Сражение включено', 'common');
            await CommonHelper.reloadPage();
            break;
        case '/start_bandits':
            await CommonHelper.log('Пришла команда включить разбойников');
            await CommonHelper.turnBandits(true);
            await CommonHelper.setExtStorage('wor_fight_pot_mp_active', true);
            await CommonHelper.sendTelegramMessage('Разбойники включены', 'common');
            await CommonHelper.reloadPage();
            break;
        case '/refresh_page':
            await CommonHelper.log('Пришла команда перезагрузить страницу');
            await CommonHelper.sendTelegramMessage('Перезагрузка выполнена', 'common');
            await CommonHelper.reloadPage();
            break;
        case '/refresh_commands_list':
            await CommonHelper.log('Пришла команда обновить команды');
            await CommonHelper.setTelegramBotCommands('common');
            await CommonHelper.sendTelegramMessage('Команды обновлены', 'common');
            await CommonHelper.reloadPage();
            break;
        case '/status':
            await CommonHelper.log('Пришла команда показать статус бота');
            let chemistry = await CommonHelper.getExtStorage('wor_chemistry_active');
            let fishing = await CommonHelper.getExtStorage('wor_fishing_active');
            let fignhting = await CommonHelper.getExtStorage('wor_fight_active');
            let bandits = await CommonHelper.getExtStorage('wor_bandits_active');
            let captcha = await CommonHelper.getExtStorage('wor_captcha_active');

            let statuses =
                'Алхимия: ' + (chemistry ? '✔️' : '❌') + '\n' +
                'Рыбалка: ' + (fishing ? '✔️' : '❌') + '\n' +
                'Сражение: ' + (fignhting ? '✔️' : '❌') + '\n' +
                'Разбойники: ' + (bandits ? '✔️' : '❌') + '\n' +
                'Капча: ' + (captcha ? '✔️' : '❌');

            await CommonHelper.sendTelegramMessage(statuses, 'common');
            await CommonHelper.reloadPage();
            break;
        case '/to_exit_url':
            await CommonHelper.log('Пришла команда перейти на URL сохранённый');
            let exitUrl = await CommonHelper.getExtStorage('wor_fight_exit_url') || null;

            if (exitUrl) {
                document.location = exitUrl;
                return;
            }

            await CommonHelper.sendTelegramMessage('Ссылка редиректа не назначена', 'common');
            break;
        default:
    }

}
