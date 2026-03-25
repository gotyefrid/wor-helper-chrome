import { CommonHelperBackground } from './CommonHelperBackground.js';

export async function disableChaosBattle() {
    try {
        const tabs = await chrome.tabs.query({});
        // Находим первую вкладку, где в URL есть "/wap/"
        const targetTab = tabs.find(tab => tab.url && tab.url.includes("/wap/"));

        if (!targetTab || !targetTab.id) {
            await CommonHelperBackground.log('Вкладка с "/wap/" в URL не найдена');
            return;
        }

        chrome.tabs.sendMessage(targetTab.id, { type: "disableChaosBattle" }, (response) => {
            if (chrome.runtime.lastError) {
                console.warn('Ошибка при отправке сообщения:', chrome.runtime.lastError.message);
                return;
            }

            if (response.error) {
                return;
            }
        });

    } catch (err) {
        CommonHelperBackground.log('Ошибка при поиске вкладки:' + JSON.stringify(err));
    }
}
