chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "setRemoteTGUpdateId") {
        setRemoteTGUpdateId(message, sender, sendResponse);
        return true; // ← ВАЖНО! Сообщаем Chrome, что ответ будет позже
    }

    if (message.type === "getRemoteTGUpdateId") {
        getRemoteTGUpdateId(message, sender, sendResponse);
        return true; // ← ВАЖНО! Сообщаем Chrome, что ответ будет позже
    }
});

async function setRemoteTGUpdateId(message, sender, sendResponse) {
    try {
        const res = await fetch("https://api.jsonsilo.com/api/v1/manage/12b4dce9-4fc5-45db-b80e-1b6600102aba", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "X-MAN-API": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX3V1aWQiOiJJY3FTTmVlSmtTZlpPU2RpUVNZRTlaU1dQTncyIiwiaXNzIjoiaHR0cHM6Ly9qc29uc2lsby5jb20iLCJleHAiOjE3NDU0MjU0NjR9.XfWShPN2cyfFyCergPswjZtq5Ta6-3HrI4NuzaLtNoU"
            },
            body: JSON.stringify({
                region_name: "api",
                is_public: true,
                file_data: {
                    wor_tg_last_update_id: String(message.updateId)
                }
            })
        });

        sendResponse({ success: true, res });
    } catch (error) {
        sendResponse({ success: false, error });
    }
}
async function getRemoteTGUpdateId(message, sender, sendResponse) {
    fetch("https://api.jsonsilo.com/api/v1/manage/12b4dce9-4fc5-45db-b80e-1b6600102aba", {
        method: "GET",
        headers: {
            "X-MAN-API": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX3V1aWQiOiJJY3FTTmVlSmtTZlpPU2RpUVNZRTlaU1dQTncyIiwiaXNzIjoiaHR0cHM6Ly9qc29uc2lsby5jb20iLCJleHAiOjE3NDU0MjU0NjR9.XfWShPN2cyfFyCergPswjZtq5Ta6-3HrI4NuzaLtNoU"
        }
    })
    .then(res => res.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(error => sendResponse({ success: false, error }));
}


