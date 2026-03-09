(async function () {
    if (!document.querySelector('form[action="login.php"]')) return;

    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    const playerName = await CommonHelper.getExtStorage('wor_chat_player_name');
    const password = await CommonHelper.getExtStorage('wor_player_password');

    if (!password) return;

    const doLogin = await CommonHelper.askWithTimeout('Авторизоваться автоматически?', 3000);

    if (doLogin) {
        const form = document.querySelector('form[action="login.php"]');
        const nameInput = form.querySelector('input[name="pname"]');
        const passInput = form.querySelector('input[name="pass"]');

        if (nameInput && playerName) nameInput.value = playerName;
        if (passInput) passInput.value = password;

        form.submit();
    }
})();
