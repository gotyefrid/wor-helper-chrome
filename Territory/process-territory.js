(async function () {
    while (typeof CommonHelper === 'undefined') {
        await new Promise(r => setTimeout(r, 50));
    }

    let currentLocation = Territory.getCurrentLocation();

    if (currentLocation == 1) {
        await processGorod();
    }

    if (currentLocation == 100) {
        await processBigTakt();
    }
    if (currentLocation == 101) {
        await processSmallTakt();
    }
})();


async function processGorod() {
    await moveOnDefaultMaps(
        [
            { id: 730, label: 'Идти в подземку' },
            { id: 510, label: 'Охотник' },
            { id: 480, label: 'Дровосек' },
            { id: 709, label: 'Кристальный остров' },
            { id: 407, label: 'Озеро' },
        ],
        [50, 100],
        doc => {
            document.body.innerHTML = doc.body.innerHTML;
        }
    )
}

async function processBigTakt() {
    const t = new Territory();

    const baseNames = {
        744: 'Левая лесопилка',
        778: 'Правая лесопилка',
        1094: 'Левая шахта',
        1161: 'Правая шахта',
        710: 'Каменоломня',
        311: 'Левая ферма',
        328: 'Правая ферма'
    };

    const container = document.querySelector('.contur');
    if (!container) return;

    // Заменяем текст названий баз на кликабельные span-элементы
    for (const [pointId, name] of Object.entries(baseNames)) {
        const regex = new RegExp(name + ':');
        container.innerHTML = container.innerHTML.replace(
            regex,
            `<span class="clickable-base" data-point="${pointId}" style="cursor:pointer;">${name}</span>:`
        );
    }

    // Навешиваем обработчики на созданные спаны
    document.querySelectorAll('.clickable-base').forEach(span => {
        span.addEventListener('click', async (e) => {
            const el = e.currentTarget;
            const pointId = parseInt(el.getAttribute('data-point'));
            showLoadingIcon(el);
            await t.toPoint(pointId, CommonHelper.getRandomNumber(20, 50), (doc) => {
                console.log(123);
                document.querySelector('.contur').innerHTML = doc.querySelector('.contur').innerHTML;
            });
        });
    });
}
async function processSmallTakt() {
    const t = new Territory();

    const baseNames = {
        205: 'Левая лесопилка',
        217: 'Правая лесопилка',
        267: 'Шахта кристаллов',
        429: 'Левая ферма',
        441: 'Правая ферма'
    };

    const container = document.querySelector('.contur');
    if (!container) return;

    // Заменяем текст названий баз на кликабельные span-элементы
    for (const [pointId, name] of Object.entries(baseNames)) {
        const regex = new RegExp(name + ':');
        container.innerHTML = container.innerHTML.replace(
            regex,
            `<span class="clickable-base" data-point="${pointId}" style="cursor:pointer;">${name}</span>:`
        );
    }

    // Навешиваем обработчики на созданные спаны
    document.querySelectorAll('.clickable-base').forEach(span => {
        span.addEventListener('click', async (e) => {
            const el = e.currentTarget;
            const pointId = parseInt(el.getAttribute('data-point'));
            showLoadingIcon(el);
            console.log(pointId);
            await t.toPoint(pointId, CommonHelper.getRandomNumber(20, 50));
        });
    });
}

// Функция для установки спиннера
function showLoadingIcon(linkElement) {
    linkElement.innerHTML = `<img src="https://i.imgur.com/llF5iyg.gif" width="20" height="20" style="vertical-align:middle"> Выполнение...`;
}

async function moveOnDefaultMaps(points, delay = [50, 100], eachCallback = null) {
    const t = new Territory();
    const menuList = document.querySelector('.menu_div ul');

    points.forEach(({ id, label }) => {
        // создаём <li> с <a>
        const li = document.createElement('li');
        li.innerHTML = `
        <a href="#" id="to${id}">
          <img src="icons/mini_karta.gif"
               width="30" height="30"
               style="vertical-align:middle">
          ${label}
        </a>
      `;
        menuList.append(li);

        // вешаем один и тот же обработчик клика
        li.querySelector('a').addEventListener('click', async e => {
            e.preventDefault();
            await t.toPoint(
                id,
                delay,
                eachCallback
            );
        });
    });
}

