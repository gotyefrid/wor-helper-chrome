(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    let notification = await CommonHelper.getExtStorage('wor_tg_notifications_active');

    if (!notification) {
        return;
    }

    while (true) {
        try {
            // Отправка сообщений из чата в Telegram
            let command = await CommonHelper.getTelegramUpdates('common');

            if (command) {
                handleTelegramCommands(command);
            } else {
                CommonHelper.log('Нет новых комманд из Телеграма для выполнения.');
            }

        } catch (err) {
            CommonHelper.log(err);
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
            await CommonHelper.sendTelegramMessage(await getStatuses(), 'common');
            await CommonHelper.reloadPage();
            break;
        case '/chemistry':
            await CommonHelper.log('Пришла команда переключить алхимию');
            let chemistry = await CommonHelper.getExtStorage('wor_chemistry_active');

            if (chemistry) {
                await CommonHelper.turnAlchemistry(false);
                await CommonHelper.turnFighting(false);
            } else {
                await CommonHelper.turnAlchemistry(true);
                await CommonHelper.turnFighting(true);
            }

            await CommonHelper.sendTelegramMessage(await getStatuses(), 'common');
            await CommonHelper.reloadPage();
            break;
        case '/captcha':
            await CommonHelper.log('Пришла команда переключить капчу');
            let captcha = await CommonHelper.getExtStorage('wor_captcha_active');

            if (captcha) {
                await CommonHelper.turnCaptcha(false);
            } else {
                await CommonHelper.turnCaptcha(true);
            }

            await CommonHelper.sendTelegramMessage(await getStatuses(), 'common');
            await CommonHelper.reloadPage();
            break;
        case '/fishing':
            await CommonHelper.log('Пришла команда переключить рыбалку');
            let fishing = await CommonHelper.getExtStorage('wor_fishing_active');

            if (fishing) {
                await CommonHelper.turnFishing(false);
                await CommonHelper.turnFighting(false);
            } else {
                await CommonHelper.turnFishing(true);
                await CommonHelper.turnFighting(true);
            }
            await CommonHelper.sendTelegramMessage(await getStatuses(), 'common');
            await CommonHelper.reloadPage();
            break;
        case '/fighting':
            await CommonHelper.log('Пришла команда переключить сражение');
            let fignhting = await CommonHelper.getExtStorage('wor_fight_active');

            if (fignhting) {
                await CommonHelper.turnFighting(false);
            } else {
                await CommonHelper.turnFighting(true);
            }

            await CommonHelper.sendTelegramMessage(await getStatuses(), 'common');
            await CommonHelper.reloadPage();
            break;
        case '/bandits':
            await CommonHelper.log('Пришла команда переключить разбойников');
            let bandits = await CommonHelper.getExtStorage('wor_bandits_active');

            if (bandits) {
                await CommonHelper.turnBandits(false);
            } else {
                await CommonHelper.turnBandits(true);
            }

            await CommonHelper.setExtStorage('wor_fight_pot_mp_active', true);
            await CommonHelper.sendTelegramMessage(await getStatuses(), 'common');
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
            await CommonHelper.sendTelegramMessage(await getStatuses(), 'common');
            break;
        case '/to_exit_url':
            await CommonHelper.log('Пришла команда перейти на URL сохранённый');
            let exitUrl = await CommonHelper.getFightExitUrl() || null;

            if (exitUrl) {
                document.location = exitUrl;
                return;
            }

            await CommonHelper.sendTelegramMessage('Ссылка редиректа не назначена', 'common');
            break;
        case '/to_gorod':
            await CommonHelper.log('Пришла команда уйти в город');
            let r = await fetch('/wap/teleport.php');
            await CommonHelper.sendTelegramMessage('Ушли в город', 'common');
            await CommonHelper.reloadPage();
            break;
        default:
    }

    async function getStatuses() {
        let chemistry = await CommonHelper.getExtStorage('wor_chemistry_active');
        let fishing = await CommonHelper.getExtStorage('wor_fishing_active');
        let fignhting = await CommonHelper.getExtStorage('wor_fight_active');
        let bandits = await CommonHelper.getExtStorage('wor_bandits_active');
        let captcha = await CommonHelper.getExtStorage('wor_captcha_active');

        return 'Алхимия: ' + (chemistry ? '✔️' : '❌') + '\n' +
            'Рыбалка: ' + (fishing ? '✔️' : '❌') + '\n' +
            'Сражение: ' + (fignhting ? '✔️' : '❌') + '\n' +
            'Разбойники: ' + (bandits ? '✔️' : '❌') + '\n' +
            'Капча: ' + (captcha ? '✔️' : '❌');
    }
}


