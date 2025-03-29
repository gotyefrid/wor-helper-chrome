
window.addEventListener("load", async function () {
    let access = await CommonHelper.getExtStorage('wor_captcha_active');

    if (!access) {
        CommonHelper.log('Обход капчи не активен.');
        CommonHelper.sendTelegramMessage('Нужно пройти капчу');
        return;
    }

});