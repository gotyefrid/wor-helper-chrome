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
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("l");
}

function highlightVisited(visitedLocations) {
    let currentLocation = getCurrentLocation();
    if (!currentLocation || !visitedLocations[currentLocation]) return;

    visitedLocations[currentLocation].forEach(id => {
        let visitedElement = document.getElementById(id);
        if (visitedElement) {
            visitedElement.style.outline = "2px solid white";
        }
    });
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
