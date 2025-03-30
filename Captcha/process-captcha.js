
window.addEventListener("load", async function () {
    let access = await CommonHelper.getExtStorage('wor_captcha_active');

    if (!access) {
        CommonHelper.log('Обход капчи не активен.');
        
        let exitUrl = await CommonHelper.getExtStorage('wor_fight_exit_url') || null;

        if (exitUrl) {
            CommonHelper.sendTelegramMessage('Нужно пройти капчу: ' + exitUrl);
            await CommonHelper.delay(15000);
            document.location = exitUrl;
            return;
        }
        CommonHelper.sendTelegramMessage('Нужно пройти капчу: ' + document.locatio.href);

        await CommonHelper.delay(15000);
        CommonHelper.reloadPage();
        return;
    }

});