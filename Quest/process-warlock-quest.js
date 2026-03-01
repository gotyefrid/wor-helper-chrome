(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    const quest = new WarlockQuest();

    if (!quest.isQuestPage) return;

    // На странице ask всегда инжектируем ссылку запуска (независимо от активности)
    if (quest.pageType === 'ask') {
        await quest.processAskPage();
        return;
    }

    const isActive = await CommonHelper.getExtStorage('wor_quest_warlock_active') ?? false;

    // Кнопка остановки на страницах process и finish
    if (isActive && (quest.pageType === 'process' || quest.pageType === 'finish')) {
        CommonHelper.createDisableButton('Остановить квест', async () => {
            await CommonHelper.setExtStorage('wor_quest_warlock_active', false);
            await CommonHelper.setExtStorage('wor_quest_warlock_pos', null);
            await CommonHelper.setExtStorage('wor_quest_warlock_visited', []);
            await CommonHelper.setExtStorage('wor_quest_warlock_history', []);
            await CommonHelper.reloadPage();
        });
    }

    if (!isActive) return;

    if (quest.pageType === 'process') {
        await CommonHelper.delay(100, 200);
        await quest.processProcessPage();
        return;
    }

    if (quest.pageType === 'finish') {
        await quest.processFinishPage();
        return;
    }

    if (quest.pageType === 'earn') {
        await quest.processEarnPage();
        return;
    }
})();
