(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    if (!window.location.pathname.includes('/wap/teritory')) return;

    // Ждём Territory и goToPoint (загружаются из другого content_scripts-блока манифеста)
    while (typeof Territory === 'undefined' || typeof goToPoint === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    await WarlockQuestRunner.handleTerritoryPage();
})();

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'startWarlockQuestRun') {
        (async () => {
            while (typeof CommonHelper === 'undefined') {
                await new Promise(r => setTimeout(r, 50));
            }
            if (window.location.pathname.includes('/wap/teritory')) {
                while (typeof Territory === 'undefined' || typeof goToPoint === 'undefined') {
                    await new Promise(r => setTimeout(r, 50));
                }
            }
            await WarlockQuestRunner.start();
        })();
    }
});
