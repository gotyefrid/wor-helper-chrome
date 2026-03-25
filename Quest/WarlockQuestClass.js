class WarlockQuest {
    isQuestPage = false;
    pageType = null; // 'ask' | 'process' | 'finish' | 'earn'

    constructor() {
        this.#checkCurrentPage();
    }

    #checkCurrentPage() {
        const conturStrong = document.querySelector('.contur strong');
        if (!conturStrong || !conturStrong.textContent.includes('Чернокнижник')) {
            return;
        }

        this.isQuestPage = true;

        const links = [...document.querySelectorAll('.error .header_mes a')];

        // 1. Есть ссылка "Завершить маршрут"? → finish
        if (links.some(a => a.textContent.includes('Завершить маршрут'))) {
            this.pageType = 'finish';
            return;
        }

        const newsFull = document.querySelector('.news_full');

        // 2. "справился с заданием" в .news_full? → earn
        if (newsFull && newsFull.textContent.includes('справился с заданием')) {
            this.pageType = 'earn';
            return;
        }

        // 3. "Куда пойти:" в .news_full? → process
        if (newsFull && newsFull.textContent.includes('Куда пойти:')) {
            this.pageType = 'process';
            return;
        }

        // 4. Иначе → ask
        this.pageType = 'ask';
    }

    // Инжектируем ссылку "Включить автовыполнение квеста" на странице ask
    async processAskPage() {
        const headerMes = document.querySelector('.error .header_mes');
        if (!headerMes) return;

        const acceptLink = [...headerMes.querySelectorAll('a')]
            .find(a => a.textContent.includes('Берусь за это'));

        if (!acceptLink) {
            CommonHelper.log('Чернокнижник: нет ссылки "Берусь за это"');
            return;
        }

        const div = document.createElement('div');
        div.style.cssText = 'margin: 10px 2px; font-size: 12px';
        div.innerHTML = '&raquo; <a href="#" id="wor_warlock_auto_start">Включить автовыполнение квеста</a>';
        headerMes.insertBefore(div, headerMes.firstChild);

        document.getElementById('wor_warlock_auto_start').addEventListener('click', async (e) => {
            e.preventDefault();

            await CommonHelper.setExtStorage('wor_quest_warlock_active', true);
            await CommonHelper.setExtStorage('wor_quest_warlock_pos', { x: 0, y: 0 });
            await CommonHelper.setExtStorage('wor_quest_warlock_visited', ['0,0']);
            await CommonHelper.setExtStorage('wor_quest_warlock_history', []);
            await CommonHelper.setExtStorage('wor_quest_warlock_steps', 0);

            CommonHelper.log('Чернокнижник: квест начат');
            await CommonHelper.sendTelegramMessage('Квест чернокнижника начат');

            await CommonHelper.delay(CommonHelper.SMALL_RANDOM);
            acceptLink.click();
        });
    }

    // DFS-шаг на странице process
    async processProcessPage() {
        let pos = await CommonHelper.getExtStorage('wor_quest_warlock_pos') ?? { x: 0, y: 0 };
        let visited = await CommonHelper.getExtStorage('wor_quest_warlock_visited') ?? [];
        let history = await CommonHelper.getExtStorage('wor_quest_warlock_history') ?? [];
        let steps = await CommonHelper.getExtStorage('wor_quest_warlock_steps') ?? 0;

        // Отмечаем текущую позицию как посещённую
        const posKey = `${pos.x},${pos.y}`;
        if (!visited.includes(posKey)) {
            visited.push(posKey);
        }

        // Парсим доступные направления из ссылок
        const moveLinks = [...document.querySelectorAll('.error .header_mes a')];
        const dirFromText = { 'вверх': 'up', 'вниз': 'down', 'влево': 'left', 'вправо': 'right' };
        const available = {};
        moveLinks.forEach(a => {
            const key = Object.keys(dirFromText).find(k => a.textContent.includes(k));
            if (key) available[dirFromText[key]] = a.href;
        });

        const deltas = {
            up:    { dx: 0,  dy: -1 },
            down:  { dx: 0,  dy: +1 },
            left:  { dx: -1, dy: 0  },
            right: { dx: +1, dy: 0  },
        };
        const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' };
        const priority = ['right', 'down', 'left', 'up'];

        // Ищем первое непосещённое направление по приоритету
        let chosenDir = null;
        for (const dir of priority) {
            if (!available[dir]) continue;
            const d = deltas[dir];
            const nextKey = `${pos.x + d.dx},${pos.y + d.dy}`;
            if (!visited.includes(nextKey)) {
                chosenDir = dir;
                break;
            }
        }

        steps++;

        if (chosenDir) {
            // Идём вперёд
            history.push(chosenDir);
            pos = { x: pos.x + deltas[chosenDir].dx, y: pos.y + deltas[chosenDir].dy };

            await CommonHelper.setExtStorage('wor_quest_warlock_pos', pos);
            await CommonHelper.setExtStorage('wor_quest_warlock_visited', visited);
            await CommonHelper.setExtStorage('wor_quest_warlock_history', history);
            await CommonHelper.setExtStorage('wor_quest_warlock_steps', steps);

            CommonHelper.log(`Чернокнижник: шаг ${steps}, иду ${chosenDir} → (${pos.x},${pos.y})`);
            window.location.href = available[chosenDir];
        } else {
            // Тупик — откатываемся
            if (history.length === 0) {
                CommonHelper.log('Чернокнижник: тупик, история пуста!');
                await CommonHelper.sendTelegramMessage('Ошибка: лабиринт чернокнижника — невозможно продолжить');
                await CommonHelper.setExtStorage('wor_quest_warlock_active', false);
                return;
            }

            const lastDir = history.pop();
            const backDir = opposite[lastDir];
            pos = { x: pos.x + deltas[backDir].dx, y: pos.y + deltas[backDir].dy };

            await CommonHelper.setExtStorage('wor_quest_warlock_pos', pos);
            await CommonHelper.setExtStorage('wor_quest_warlock_visited', visited);
            await CommonHelper.setExtStorage('wor_quest_warlock_history', history);
            await CommonHelper.setExtStorage('wor_quest_warlock_steps', steps);

            CommonHelper.log(`Чернокнижник: тупик, откатываюсь ${backDir} → (${pos.x},${pos.y})`);

            await CommonHelper.delay(100, 200);
            window.location.href = available[backDir];
        }
    }

    // Страница finish: кликаем "Завершить маршрут"
    async processFinishPage() {
        const finishLink = [...document.querySelectorAll('.error .header_mes a')]
            .find(a => a.textContent.includes('Завершить маршрут'));

        if (!finishLink) {
            CommonHelper.log('Чернокнижник: нет ссылки завершения');
            return;
        }

        CommonHelper.log('Чернокнижник: нашли выход, завершаем маршрут');
        await CommonHelper.delay(100, 200);
        finishLink.click();
    }

    // Страница earn: выбираем награду WR, очищаем storage
    async processEarnPage() {
        const earnLink = [...document.querySelectorAll('.error .header_mes a')]
            .find(a => a.textContent.includes('WR'));

        if (!earnLink) {
            CommonHelper.log('Чернокнижник: нет ссылки награды WR');
            return;
        }

        const steps = await CommonHelper.getExtStorage('wor_quest_warlock_steps') ?? 0;

        await CommonHelper.setExtStorage('wor_quest_warlock_active', false);
        await CommonHelper.setExtStorage('wor_quest_warlock_pos', null);
        await CommonHelper.setExtStorage('wor_quest_warlock_visited', []);
        await CommonHelper.setExtStorage('wor_quest_warlock_history', []);

        CommonHelper.log(`Чернокнижник: квест пройден за ${steps} шагов`);
        await CommonHelper.sendTelegramMessage(`Квест чернокнижника пройден за ${steps} шагов, получена награда WR`);

        await CommonHelper.delay(CommonHelper.SMALL_RANDOM);
        earnLink.click();
    }
}
