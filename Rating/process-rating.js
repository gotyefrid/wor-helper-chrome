(function () {
    // Ищем все таблицы с классом table_modern
    const tables = document.querySelectorAll("table.table_modern");

    tables.forEach(table => {
        const rows = table.querySelectorAll("tbody tr");
        if (rows.length < 2) return; // нет данных

        // Добавляем новый заголовок
        const headerRow = rows[0];
        const diffHeader = document.createElement("td");
        diffHeader.textContent = "Отставание от ТОП1";
        headerRow.appendChild(diffHeader);

        // Получаем количество рыб у первого игрока
        const firstPlaceCells = rows[1].querySelectorAll("td");
        if (firstPlaceCells.length < 3) return;
        const firstCount = parseInt(firstPlaceCells[2].textContent.replace(/\D/g, ''), 10);

        // Обрабатываем всех игроков, начиная со 2 строки (пропускаем заголовок)
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll("td");
            if (cells.length < 3) continue; // пропускаем некорректные строки

            const currentCount = parseInt(cells[2].textContent.replace(/\D/g, ''), 10);
            const diff = firstCount - currentCount;

            const diffCell = document.createElement("td");
            diffCell.style.textAlign = "center";
            diffCell.textContent = diff === 0 ? "-" : diff.toString();

            rows[i].appendChild(diffCell);
        }
    });
})();
