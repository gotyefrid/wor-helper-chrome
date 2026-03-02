class WarlockQuestRunner {
    static STORAGE_KEY = 'wor_warlock_quest_run';
    static TARGET_LOCATION = '5';
    static TARGET_ROOM = 135;

    /**
     * Точка входа из popup. Устанавливает флаг и начинает процесс.
     */
    static async start() {
        await CommonHelper.setExtStorage(WarlockQuestRunner.STORAGE_KEY, { active: true });

        if (!window.location.pathname.includes('/wap/teritory')) {
            // Не на карте — редиректим, IIFE подхватит при загрузке
            document.location = '/wap/teritory.php';
            return;
        }

        await WarlockQuestRunner.#proceedOnTerritoryPage();
    }

    /**
     * Вызывается из IIFE при загрузке страницы территории.
     * Проверяет флаг и либо кликает дверь, либо запускает навигацию.
     */
    static async handleTerritoryPage() {
        const state = await CommonHelper.getExtStorage(WarlockQuestRunner.STORAGE_KEY);
        if (!state?.active) return;

        // Глобальная навигация уже движется к цели — не мешаем
        const globalNav = await CommonHelper.getExtStorage('wor_global_nav');
        if (globalNav?.active) return;

        await WarlockQuestRunner.#proceedOnTerritoryPage();
    }

    /**
     * Вызывается из process-warlock-quest.js на странице ask.
     * @returns {boolean} true если обработал автоматически
     */
    static async handleQuestPage() {
        const state = await CommonHelper.getExtStorage(WarlockQuestRunner.STORAGE_KEY);
        if (!state?.active) return false;

        const links = [...document.querySelectorAll('a')];

        // Квест уже пройден сегодня
        if (links.some(a => a.textContent.includes('Отойти от двери'))) {
            await CommonHelper.log('WarlockQuestRunner: квест уже пройден сегодня, возвращаемся');
            await CommonHelper.setExtStorage(WarlockQuestRunner.STORAGE_KEY, { active: false });
            await CommonHelper.delay(400, 700);
            document.location = '/wap/teritory.php';
            return true;
        }

        // Квест доступен — принимаем и запускаем
        const acceptLink = links.find(a => a.textContent.includes('Хорошо. Берусь за это'));
        if (acceptLink) {
            CommonHelper.log('WarlockQuestRunner: принимаем квест и запускаем автовыполнение');
            await CommonHelper.setExtStorage('wor_quest_warlock_active', true);
            await CommonHelper.setExtStorage('wor_quest_warlock_pos', { x: 0, y: 0 });
            await CommonHelper.setExtStorage('wor_quest_warlock_visited', ['0,0']);
            await CommonHelper.setExtStorage('wor_quest_warlock_history', []);
            await CommonHelper.setExtStorage('wor_quest_warlock_steps', 0);
            await CommonHelper.setExtStorage(WarlockQuestRunner.STORAGE_KEY, { active: false });
            await CommonHelper.sendTelegramMessage('Квест чернокнижника начат');
            await CommonHelper.delay(300, 500);
            acceptLink.click();
            return true;
        }


        CommonHelper.log('WarlockQuestRunner: что-то пошло не так');
        return false;
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    static async #proceedOnTerritoryPage() {
        const location = Territory.getCurrentLocation();
        const emptyCell = document.querySelector('.map-cell:empty');
        const room = emptyCell ? parseInt(emptyCell.getAttribute('data-room'), 10) : null;

        if (String(location) === WarlockQuestRunner.TARGET_LOCATION && room === WarlockQuestRunner.TARGET_ROOM) {
            await WarlockQuestRunner.#clickWarlockDoor();
        } else {
            await goToPoint(WarlockQuestRunner.TARGET_LOCATION, WarlockQuestRunner.TARGET_ROOM);
        }
    }

    static async #clickWarlockDoor() {
        const link = [...document.querySelectorAll('.menu_div a')]
            .find(a => a.textContent.trim() === 'Чернокнижник');

        if (!link) {
            CommonHelper.log('WarlockQuestRunner: ссылка "Чернокнижник" не найдена в .menu_div');
            await CommonHelper.setExtStorage(WarlockQuestRunner.STORAGE_KEY, { active: false });
            return;
        }

        CommonHelper.log('WarlockQuestRunner: кликаем на Чернокнижник');
        await CommonHelper.delay(300, 600);
        document.location = link.href;
    }
}
