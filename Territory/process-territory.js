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
    if (currentLocation == 7) {
        await processSavanna();
    }
    if (currentLocation == 6) {
        await processKat3();
    }
    if (currentLocation == 5) {
        await processKat2();
    }
    if (currentLocation == 4) {
        await processKat1();
    }
    if (currentLocation == 3) {
        await processPodzemka();
    }

})();

async function processSavanna() {
    let t = new Territory();
    let walkAllMapStatus = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');
    let delay = [50, 100];
    
    await moveOnDefaultMaps(
        [
            {
                id: 284,
                label: 'Катакомбы 3',
                action: async (e) => {
                    await t.toPoint(284, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=228"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            {
                id: 486,
                label: 'Катакомбы 4',
                action: async (e) => {
                    await t.toPoint(486, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=431"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            {
                id: 1477,
                label: 'Логово',
                action: async (e) => {
                    await t.toPoint(1477, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=1478"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            renderWalkAllMapButton(walkAllMapStatus)
        ]
    );

    if (walkAllMapStatus === true) {
        await walkAroundMap();
    }
}

async function processKat3() {
    let t = new Territory();
    let walkAllMapStatus = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');
    let delay = [50, 100];
    
    await moveOnDefaultMaps(
        [
            {
                id: 308,
                label: 'Саванна',
                action: async (e) => {
                    await t.toPoint(308, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=309"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            {
                id: 204,
                label: 'Катакомбы 2',
                action: async (e) => {
                    await t.toPoint(204, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=203"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            renderWalkAllMapButton(walkAllMapStatus)
        ]
    );

    if (walkAllMapStatus === true) {
        await walkAroundMap();
    }
}
async function processKat2() {
    let t = new Territory();
    let walkAllMapStatus = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');
    let delay = [50, 100];
    
    await moveOnDefaultMaps(
        [
            {
                id: 135, label: 'Чернокнижник', action: async (e) => {
                    await t.toPoint(135, delay);
                }
            },
            {
                id: 161,
                label: 'Катакомбы 3',
                action: async (e) => {
                    await t.toPoint(161, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=185"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            {
                id: 171,
                label: 'Катакомбы 1',
                action: async (e) => {
                    await t.toPoint(171, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=146"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            renderWalkAllMapButton(walkAllMapStatus)
        ]
    );

    if (walkAllMapStatus === true) {
        await walkAroundMap();
    }
}
async function processKat1() {
    let t = new Territory();
    let walkAllMapStatus = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');
    let delay = [50, 100];
    
    await moveOnDefaultMaps(
        [
            {
                id: 101,
                label: 'Подземелье',
                action: async (e) => {
                    await t.toPoint(101, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=81"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            {
                id: 108,
                label: 'Катакомбы 2',
                action: async (e) => {
                    await t.toPoint(108, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=90"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            renderWalkAllMapButton(walkAllMapStatus)
        ]
    );

    if (walkAllMapStatus === true) {
        await walkAroundMap();
    }
}

async function processPodzemka() {
    let t = new Territory();
    let walkAllMapStatus = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');
    let delay = [50, 100];
    
    await moveOnDefaultMaps(
        [
            {
                id: 164,
                label: 'Город',
                action: async (e) => {
                    await t.toPoint(164, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=132"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            {
                id: 303,
                label: 'Катакомбы 1',
                action: async (e) => {
                    await t.toPoint(303, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=304"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            renderWalkAllMapButton(walkAllMapStatus)
        ]
    );

    if (walkAllMapStatus === true) {
        await walkAroundMap();
    }
}
async function processGorod() {
    let t = new Territory();

    let delay = [50, 300];
    let walkAllMapStatus = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');

    await moveOnDefaultMaps(
        [
            {
                id: 765,
                label: 'Подземелье',
                action: async (e) => {
                    await t.toPoint(765, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=730"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            {
                id: 510, label: 'Охотник', action: async (e) => {
                    await t.toPoint(510, delay);
                }
            },
            {
                id: 480, label: 'Дровосек', action: async (e) => {
                    await t.toPoint(480, delay);
                }
            },
            {
                id: 674,
                label: 'Кристальный остров',
                action: async (e) => {
                    await t.toPoint(674, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=710"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            {
                id: 442,
                label: 'Озеро',
                action: async (e) => {
                    await t.toPoint(442, delay, null, (doc) => {
                        let tpLink = doc.querySelector('a[href*="crd=407"]');
                        if (tpLink) {
                            document.location = tpLink.href;
                        } else {
                            CommonHelper.reloadPage();
                        }
                    });
                }
            },
            renderWalkAllMapButton(walkAllMapStatus)
        ]
    );

    if (walkAllMapStatus === true) {
        await walkAroundMap();
    }
}

function renderWalkAllMapButton(walkAllMapStatus) {
    return {
        id: 'all',
        label: walkAllMapStatus ? 'Остановить обход всех точек' : 'Запустить обход всех точек',
        action: async (e) => {
            let status = await CommonHelper.getExtStorage('wor_map_walk_all_map_active');

            if (status === true) {
                await CommonHelper.setExtStorage('wor_map_walk_all_map_active', false);
                await CommonHelper.reloadPage();
                return;
            }

            await CommonHelper.setExtStorage('wor_map_walk_all_map_active', true);
            e.target.innerHTML = e.target.innerHTML.replace('Запустить обход всех точек', 'Остановить обход всех точек');
            e.target.innerHTML = e.target.innerHTML.replace('mini_karta', 'optsii_igroka');
            await walkAroundMap();
        }
    };
}

async function walkAroundMap(delay = [50, 100]) {
    let t = new Territory();

    let visited = await CommonHelper.getExtStorage('visitedLocations');

    let path = t.traverseAllPoints(visited[t.currentLocation]);
    path.shift();

    if (path.length === 0) {
        alert('Все точки уже посещены!');
        return;
    }


    await t.moveByPath(
        path,
        delay,
        async (doc) => {
            document.querySelector('table').innerHTML = doc.querySelector('table').innerHTML;

            // «зелёная» клетка, на которой стоит герой
            const currentCell = doc.querySelector(
                "td[style*='background-color: #00CC00'] div"
            );

            if (currentCell) {
                const id = currentCell.id.replace("r", "");
                visited[t.currentLocation] ??= [];

                if (!visited[t.currentLocation].includes(id)) {
                    console.log('Добавляем точку');
                    visited[t.currentLocation].push(id);
                    await CommonHelper.setExtStorage('visitedLocations', visited);
                }
            }
        },
        async (doc) => {
            await CommonHelper.setExtStorage('wor_map_walk_all_map_active', false);
            alert('Все клетки посещены');
        }
    );
}

async function processBigTakt() {
    const baseNames = {
        744: 'Левая лесопилка',
        778: 'Правая лесопилка',
        1094: 'Левая шахта',
        1161: 'Правая шахта',
        710: 'Каменоломня',
        311: 'Левая ферма',
        328: 'Правая ферма'
    };
    processTaktCommon(baseNames);
}

async function processTaktCommon(baseNames) {
    const t = new Territory();
    const container = document.querySelector('.contur');
    if (!container) return;

    // 1. Извлекаем номер нашей команды
    const teamMatch = container.textContent.match(/Вы в команде №(\d+)/);
    const myTeam = teamMatch ? parseInt(teamMatch[1], 10) : null;

    // Заменяем названия баз на кликабельные спаны
    for (const [pointId, name] of Object.entries(baseNames)) {
        const regex = new RegExp(name + ':');
        container.innerHTML = container.innerHTML.replace(
            regex,
            `<span class="clickable-base" data-point="${pointId}" style="cursor:pointer;">${name}</span>:`
        );
    }

    // Собираем все спаны в массив в порядке их появления
    const clickableSpans = Array.from(container.querySelectorAll('.clickable-base'));

    // Пронумеровываем их в тексте: [1] Левая лесопилка, [2] Правая лесопилка и т.д.
    clickableSpans.forEach((span, idx) => {
        span.textContent = `[${idx + 1}] ${span.textContent}`;
    });

    // Вешаем клики на каждый
    clickableSpans.forEach(span => {
        span.addEventListener('click', async e => {
            const el = e.currentTarget;
            const pointId = parseInt(el.getAttribute('data-point'), 10);
            const baseName = baseNames[pointId];

            // 2. Определяем, была ли база наша уже в момент клика
            let initialOurs = false;
            const nextElem = el.nextElementSibling;
            if (nextElem) {
                const m0 = nextElem.textContent.match(/№(\d+)/);
                if (m0 && myTeam !== null) {
                    initialOurs = parseInt(m0[1], 10) === myTeam;
                }
            }

            // 3. Бежим к точке
            await t.toPoint(pointId, [20, 50], doc => {
                if (initialOurs) {
                    document.body.innerHTML = doc.querySelector('body').innerHTML;
                    return;
                }
                const newCont = doc.querySelector('.contur');
                if (newCont && myTeam !== null) {
                    const re = new RegExp(
                        baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
                        ':[\\s\\S]*?№(\\d+)',
                        'i'
                    );
                    const m = newCont.innerHTML.match(re);
                    const capturedTeam = m ? parseInt(m[1], 10) : null;
                    if (capturedTeam === myTeam) {
                        return CommonHelper.reloadPage();
                    }
                }
                document.body.innerHTML = doc.querySelector('body').innerHTML;
            });
        });
    });

    // Привязка нажатий клавиш 1–9 к индексам в clickableSpans
    document.addEventListener('keydown', e => {
        if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        const idx = Number(e.key) - 1;
        if (!isNaN(idx) && idx >= 0 && idx < clickableSpans.length) {
            clickableSpans[idx].click();
        }
    });
}

async function processSmallTakt() {
    const baseNames = {
        205: 'Левая лесопилка',
        217: 'Правая лесопилка',
        267: 'Шахта кристаллов',
        429: 'Левая ферма',
        441: 'Правая ферма'
    };
    processTaktCommon(baseNames);
}

// Функция для установки спиннера
function showLoadingIcon(linkElement) {
    linkElement.innerHTML = `<img src="https://i.imgur.com/llF5iyg.gif" width="20" height="20" style="vertical-align:middle"> Выполнение...`;
}

async function moveOnDefaultMaps(points) {
    const menuList = document.querySelector('.menu_div ul');

    points.forEach(({ id, label, action }) => {
        // создаём пункт меню
        const li = document.createElement('li');
        li.innerHTML = `
          <a href="#" id="to${id}">
            <img src="icons/mini_karta.gif" width="30" height="30" style="vertical-align:middle">
            ${label}
          </a>
        `;
        menuList.append(li);

        // при клике идём в точку и по окончании вызываем action()
        li.querySelector('a').addEventListener('click', async e => {
            e.preventDefault();
            await action(e);
        });
    });
}


