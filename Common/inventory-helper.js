if (document.location.href.includes('game.php')) {

    (function () {
        const fishData = {
            "Карась": { price: 7, smokedExtra: 4.6 },
            "Окунь": { price: 8, smokedExtra: 4.6 },
            "Карп": { price: 10, smokedExtra: 4.6 },
            "Лещ": { price: 12, smokedExtra: 5.5 },
            "Судак": { price: 15, smokedExtra: 5.5 },
        };

        const smokedNames = {
            "Карась": "Жареный карась",
            "Окунь": "Жареный окунь",
            "Карп": "Жареный карп",
            "Лещ": "Копченый лещ",
            "Судак": "Копченый судак"
        };

        const herbsData = {
            "Корни алтея": [15, 20],
            "Корни арала": [18, 24],
            "Корни арники": [15, 20],
            "Корни володуши": [16, 21],
            "Корни галеги": [18, 24],
            "Корни горечи": [21, 28],
            "Корни гравилата": [16, 21],
            "Корни девясила": [24, 32],
            "Корни женьшеня": [23, 31],
            "Корни лопуха": [16, 21],
            "Корни мелиссы": [23, 31],
            "Корни чистотела": [24, 32]
        };

        const resourcePrices = {
            "Уголь": 3, "Камень": 3.3, "Руда": 1.8, "Серебро": 2, "Медь": 3.2, "Золото": 3.3,
            "Фионид": 6.6, "Сапфир": 3.6, "Ясень": 4.6, "Клён": 5.5, "Дуб": 6.6, "Кр. дерево": 7.9,
            "Обр. камень": 4.5, "Сл. руды": 2.6, "Сл. серебра": 2.9, "Сл. меди": 4.5,
            "Сл. золота": 8.8, "Сл. фионида": 9.3
        };

        const rows = Array.from(document.querySelectorAll("table.table_modern tr"));
        const inventory = {};

        rows.forEach(row => {
            const tds = row.querySelectorAll("td");
            if (tds.length === 3) {
                const name = tds[1].innerText.trim();
                const count = parseInt(tds[2].innerText.trim());
                inventory[name] = count;
            }
        });

        // Подсчёты
        let resourceTotal = 0;
        for (let name in resourcePrices) {
            const qty = inventory[name] || 0;
            resourceTotal += qty * resourcePrices[name];
        }

        let rawFishTotal = 0;
        let smokedFishTotal = 0;
        let allFishActual = 0;
        let allFishHypothetical = 0;

        for (let fish in fishData) {
            const rawQty = inventory[fish] || 0;
            const smokedName = smokedNames[fish];
            const smokedQty = inventory[smokedName] || 0;
            const basePrice = fishData[fish].price;
            const extra = fishData[fish].smokedExtra;
            const smokedPrice = basePrice + extra;

            rawFishTotal += rawQty * basePrice;
            smokedFishTotal += smokedQty * smokedPrice;
            allFishActual += rawQty * basePrice + smokedQty * smokedPrice;
            allFishHypothetical += (rawQty + smokedQty) * smokedPrice;
        }

        let herbTotal = 0;
        let decoctionTotal = 0;
        let decoctionHypotheticalTotal = 0;

        for (let herb in herbsData) {
            const qty = inventory[herb] || 0;
            const [unitPrice, decoctionPrice] = herbsData[herb];
            herbTotal += qty * unitPrice;
            decoctionHypotheticalTotal += qty * decoctionPrice;
        }

        for (let name in inventory) {
            if (name.toLowerCase().includes("отвар")) {
                const herbName = name.replace("Отвар ", "");
                if (herbsData[herbName]) {
                    const price = herbsData[herbName][1];
                    decoctionTotal += inventory[name] * price;
                }
            }
        }

        const totalUnprocessed = resourceTotal + rawFishTotal + herbTotal;
        const totalProcessed = resourceTotal + allFishHypothetical + decoctionTotal;
        const totalHypothetical = resourceTotal + allFishHypothetical + decoctionHypotheticalTotal;

        // Формируем HTML таблицу
        const statsTable = document.createElement("table");
        statsTable.className = "table_modern";
        statsTable.style.cssText = "border:0; max-width:360px; margin-bottom:20px";

        const rowsHTML = [
            ["📊 Статистика по всем ресурсам", ''],
            ["📦 Стоимость ресурсов", resourceTotal],
            ["🐟 Стоимость всех сырых рыб", rawFishTotal],
            ["🔥 Стоимость всех копчёных рыб", smokedFishTotal],
            ["🎣 Фактическая стоимость всех рыб (сырые + копчёные)", allFishActual],
            ["💭 Гипотетическая стоимость всех рыб (если всё закоптить)", allFishHypothetical],
            ["🌿 Стоимость всех трав/корней/грибов (не отваров)", herbTotal],
            ["🧪 Стоимость всех отваров (реально в наличии)", decoctionTotal],
            ["🌡️ Гипотетическая стоимость отваров (если все травы превратить в отвары)", decoctionHypotheticalTotal],
            ["📊 Общая стоимость необработанных продуктов", totalUnprocessed],
            ["⚗️ Общая стоимость обработанных продуктов", totalProcessed],
            ["🧠 Общая гипотетическая стоимость (ресурсы + все рыбы закопчены + все травы в отвары)", totalHypothetical],
        ];

        const tbody = document.createElement("tbody");

        rowsHTML.forEach(([label, value]) => {
            const tr = document.createElement("tr");
            if (typeof value === "number") {
                tr.innerHTML = `
                    <td colspan="2" style="font-size:12px">${label}</td>
                    <td align="center" style="font-size:15px">${value.toFixed(0)}</td>
                `;
            } else {
                tr.innerHTML = `
                    <td colspan="3">${label}</td>
                `;
            }
            tbody.appendChild(tr);
        });

        statsTable.appendChild(tbody);

        // Вставка перед первой таблицей с ресурсами
        const firstTable = document.querySelector("table.table_modern");
        if (firstTable) {
            firstTable.parentNode.insertBefore(statsTable, firstTable);
        }
    })();
}
