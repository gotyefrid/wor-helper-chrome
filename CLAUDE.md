# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## О проекте

Это Chrome расширение для браузерной игры "World of Rest" (WOR). Расширение автоматизирует различные игровые активности: рыбалку, добычу руды, бои, алхимию, движение по карте и другие действия.

## Архитектура расширения

### Манифест и структура

- **Manifest v3**: Расширение использует Manifest V3 (`manifest.json`)
- **Service Worker**: `Backend/background.js` - фоновый процесс с модульной структурой (ES modules)
- **Content Scripts**: Скрипты внедряются на страницы игры по URL-паттернам, определённым в манифесте
- **Popup**: `popup.html` + `popup.js` - интерфейс настроек расширения

### Модульная структура по функциям

Каждая игровая функция организована в отдельную папку:

- **Backend/** - фоновые процессы, alarms, обработка сообщений
- **Common/** - общие хелперы, команды, статистика, инвентарь
- **Fishing/** - автоматизация рыбалки
- **Mining/** - автоматизация добычи руды
- **Chemistry/** - автоматизация алхимии/сбора трав
- **Fight/** - автоматизация боёв и разбойников
- **Captcha/** - решение капчи через внешний сервис
- **Territory/** - работа с картой, история перемещений
- **Chat/** - функции чата, быстрые ответы
- **Rating/** - обработка рейтинга
- **ActualPagesHtml/** - актуальная HTML-вёрстка страниц игры для справки

Файлы `process-*.js` обычно:
- Ждут загрузки `CommonHelper`
- Проверяют настройки из `chrome.storage`
- Создают экземпляр класса модуля
- Запускают логику в зависимости от текущей страницы

### Общие хелперы

**CommonHelper** (`Common/CommonHelper.js`):
- Работа с задержками и случайными числами
- Логирование
- Работа с `chrome.storage.local`
- Отправка Telegram уведомлений
- Утилиты для кликов, навигации, парсинга страниц

**CommonHelperBackground** (`Backend/CommonHelperBackground.js`):
- Аналог `CommonHelper` для service worker
- Работа с storage
- Отправка в Telegram

### Content Scripts: порядок загрузки

В `manifest.json` определены группы content scripts. Порядок важен:

1. **Базовые скрипты** (на всех страницах `/wap/*`):
   - `Common/moving-key.js` - движение клавишами
   - `Common/CommonHelper.js` - общий хелпер
   - `Chat/luxon.js` - библиотека для работы с датами
   - `Chat/Chat.js` - чат класс
   - `Common/process-common.js` - общие процессы (парсинг, проверка травмы)
   - `Common/process-commands.js` - обработка команд

2. **Специфичные модули** загружаются только на соответствующих URL

### Storage ключи

Все настройки хранятся в `chrome.storage.local` с префиксом `wor_`:

- `wor_fishing_active` - включена ли рыбалка
- `wor_mining_active` - включена ли добыча
- `wor_fighting_active` - включены ли бои
- `wor_log_active` - включено ли логирование
- `wor_tg_bot_common_token` - токен Telegram бота
- `wor_tg_chat_id` - ID чата Telegram
- `wor_map_move_delay` - задержка при автоперемещениях
- и т.д.

Для работы с storage используйте:
- `CommonHelper.getExtStorage(key)` в content scripts
- `CommonHelperBackground.getExtStorage(key)` в service worker

### Background Service Worker

`Backend/background.js` использует:

- **Chrome Alarms API** для периодических задач:
  - `sendMessagesAlarm` - каждые 15 секунд (отправка сообщений из чата)
  - `disableChaosBattle` - каждые 30 минут

- **Message passing** для взаимодействия с content scripts:
  - `sendRequestResolveCaptcha` - отправка изображения капчи на внешний сервис

### Асинхронность и задержки

- Весь код использует `async/await`
- `CommonHelper.delay(ms)` или `CommonHelper.delay(msFrom, msTo)` для задержек
- Предустановленные константы задержек: `SMALL_RANDOM`, `MEDIUM_RANDOM`, `LARGE_RANDOM` и т.д.
- MutationObserver используется для ожидания появления элементов на странице

### Навигация и клики

- `CommonHelper.clickAndWait(element, delay)` - кликнуть и подождать
- `CommonHelper.reloadPage()` - перезагрузить страницу с большой задержкой
- `window.location.href = url` для навигации между страницами

### Проверка страниц

Модули определяют тип страницы через анализ URL и содержимого:

```javascript
this.isFishingPage = fishingPaths.some(path => location.pathname.includes(path));
const zag = [...document.querySelectorAll('.zagolovok')];
this.isWaitingFishPage = zag.some(div => div.textContent.includes('удочка закинута'));
```

### Telegram уведомления

- `CommonHelper.sendTelegramMessage(text, bot, notify, parseMode, expireInSeconds)`
- Два бота: `'common'` (уведомления) и `'chat'` (сообщения из чата)
- Дедупликация сообщений через сохранение последнего сообщения с timestamp

### Библиотеки

- **jQuery 3.7.1** - манипуляции с DOM, AJAX
- **Select2** - dropdown с поиском в popup.html
- **Luxon** - работа с датами и временем в чате

## Справочные HTML-страницы игры

В папке `ActualPagesHtml/` хранится актуальная HTML-вёрстка ключевых страниц сайта игры. Используй эти файлы для:
- написания правильных CSS-селекторов
- понимания структуры DOM с которым работают скрипты
- поиска нужных классов, id и атрибутов элементов

Доступные файлы:
- `game.html` - основная игровая страница (бои, локация, персонаж)
- `teritory.html` - страница карты/территории
- `inventar.html` - страница инвентаря
- `chat2.html` - страница чата
- `quest-warlock-ask.html` - диалог с чернокнижником (страница согласия на выполнение квеста)
- `quest-warlock-process.html` - страница выполнения квеста чернокнижника (пример 1)
- `quest-warlock-process2.html` - страница выполнения квеста чернокнижника (пример 2)
- `quest-warlock-finish.html` - страница с найденным выходом из лабиринта (кнопка завершения)
- `quest-warlock-finish-earn.html` - страница выбора награды после завершения квеста
- `teritory-takt.html` - страница тактического боя

При написании селекторов или поиске элементов **всегда сверяйся** с соответствующим файлом из этой папки.

## Разработка

### Загрузка в Chrome

1. Откройте `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку с проектом

### Отладка

- **Content scripts**: DevTools на странице игры → Console
- **Background service worker**: `chrome://extensions/` → "Инспектировать представления: service worker"
- **Popup**: ПКМ на иконке расширения → "Инспектировать всплывающее окно"

### Логирование

Логи выводятся через `CommonHelper.log(message, showInFront, important, toConsole)`:
- `showInFront` - показать на странице (в данный момент отключено)
- `important` - всегда выводить в консоль
- `toConsole` - выводить в консоль если включено `wor_log_active`

Включить/выключить логи можно в popup расширения (переключатель "Лог").

### Обработка ошибок

- Используйте `try/catch` в асинхронных функциях
- Критические ошибки отправляются в Telegram через `CommonHelperBackground.sendTelegramMessage()`
- Все ошибки логируются через `CommonHelper.log()`

## Важные замечания

- Все изменения в `manifest.json` требуют перезагрузки расширения в Chrome
- Content scripts выполняются в изолированном контексте страницы (isolated world)
- Для передачи данных между content script и background используйте `chrome.runtime.sendMessage()`
- Service worker может быть выгружен браузером, используйте `chrome.storage` для персистентности
- Все задержки должны иметь случайный компонент для имитации человеческого поведения