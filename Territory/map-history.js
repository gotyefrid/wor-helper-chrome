start();

async function start() {
    let access = await chrome.storage.local.get(["wor_maphistory_active"]);

    if (!access.wor_maphistory_active) {
        return;
    }

    let r = await chrome.storage.local.get(["visitedLocations"]);
    let visitedLocations = r.visitedLocations || {};

    trackPosition(visitedLocations);
}


function getCurrentLocation() {
    const link = document.querySelector('a[href*="l="]');

    if (link) {
        const urlParams = new URLSearchParams(link.href.split('?')[1]);
        const lValue = urlParams.get("l");
        return lValue;
    }

    return null;
}


function highlightVisited(visitedLocations) {
    injectHighlightStyles(); // один раз при загрузке
    let currentLocation = getCurrentLocation();
    if (!currentLocation || !visitedLocations[currentLocation]) return;

    visitedLocations[currentLocation].forEach(id => {
        let visitedElement = document.getElementById(id);
        if (visitedElement) {
            visitedElement.classList.add("visited-highlight");
        }
    });
}


function injectHighlightStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .visited-highlight {
            position: relative !important;
        }
        .visited-highlight::after {
            content: "";
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            z-index: 10;
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

function trackPosition(visitedLocations) {
    let currentLocation = getCurrentLocation();
    if (!currentLocation) return;

    let currentCell = document.querySelector("td[style*='background-color: #00CC00'] div");
    if (currentCell) {
        let currentId = currentCell.id;

        if (!visitedLocations[currentLocation]) {
            visitedLocations[currentLocation] = [];
        }

        if (!visitedLocations[currentLocation].includes(currentId)) {
            visitedLocations[currentLocation].push(currentId);
            chrome.storage.local.set({ ["visitedLocations"]: visitedLocations });
        }
    }
    highlightVisited(visitedLocations);
}
