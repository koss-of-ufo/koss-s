// Функция для обновления статуса через HTTP
async function updateStatus() {
    try {
        // Получаем IP из поля ввода
        const ip = document.getElementById('ip').value;
        
        if (!ip) {
            throw new Error('IP адрес не указан');
        }

        // Создаем контейнер для статуса, если его еще нет
        if (!document.getElementById('status-container')) {
            createStatusContainer();
        }

        // Показываем индикатор загрузки
        const statusContainer = document.getElementById('status-container');
        statusContainer.innerHTML = '<div class="status-section"><p>Загрузка статуса...</p></div>';

        console.log('Отправляем запрос к IP:', ip);

        // Отправляем HTTP запрос с таймаутом
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(`http://192.168.11.90:8003/proxy-status?ip=${ip}`, {
                signal: controller.signal,
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.data) {
                console.log('Обновляем информацию о статусе:', data.data);
                updateStatusInfo(data.data);
            } else {
                console.log('Нет данных в ответе:', data);
                statusContainer.innerHTML = '<div class="status-section"><p>Нет данных о статусе</p></div>';
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Таймаут запроса');
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        console.error('Ошибка при получении статуса:', error);
        const statusContainer = document.getElementById('status-container');
        if (statusContainer) {
            statusContainer.innerHTML = '<div class="status-section"><p>Ошибка: ' + error.message + '</p></div>';
        }
    }
}

// Функция для обновления информации на странице
function updateStatusInfo(data) {
    const statusContainer = document.getElementById('status-container');
    if (!statusContainer) {
        createStatusContainer();
        return updateStatusInfo(data);
    }

    const atm = data.ATM;

    // Основная информация
    const mainInfo = `
        <div class="status-section">
            <h3>Основная информация</h3>
            <div class="status-content">
                <div>
                    <p>ПВП: ${data.plaza} | Полоса: ${data.lane} | ${data.activeLane ? 'Активна' : 'Неактивна'}</p>
                    <p>Режим: ${formatLaneMode(data.laneMode)} | Направление: ${formatDirection(data.direction)}</p>
                    <p>Версия ATM: ${atm.version} | Запуск: ${formatDateTime(atm.startupTime)}</p>
                </div>
            </div>
        </div>
    `;

    // BNR статус
    const bnrInfo = `
        <div class="status-section">
            <h3>BNR</h3>
            <div class="status-content">
                <div>
                    <p><strong>Up:</strong> ${formatDeviceStatus(atm.BNRUp?.devices?.BNRup?.status)} | 
                    ${atm.BNRUp?.connected ? '✓' : '✗'} | 
                    ${atm.BNRUp?.enabled ? 'Активен' : 'Неактивен'} | 
                    Сейф: ${formatSafeStatus(atm.BNRUp?.devices?.BNRup?.safeDoorStatus)}</p>
                </div>
                <div>
                    <p><strong>Down:</strong> ${formatDeviceStatus(atm.BNRDown?.devices?.BNRdown?.status)} | 
                    ${atm.BNRDown?.connected ? '✓' : '✗'} | 
                    ${atm.BNRDown?.enabled ? 'Активен' : 'Неактивен'} | 
                    Сейф: ${formatSafeStatus(atm.BNRDown?.devices?.BNRdown?.safeDoorStatus)}</p>
                </div>
            </div>
        </div>
    `;

    // Принтеры
    const printerInfo = `
        <div class="status-section">
            <h3>Принтеры</h3>
            <div class="status-content">
                <div>
                    <p><strong>Up:</strong> ${atm.printer?.devices?.printerUp?.connected ? '✓' : '✗'} | 
                    Режим: ${atm.printer?.devices?.printerUp?.kktMode || '-'} | 
                    Смена: ${atm.printer?.devices?.printerUp?.kktShiftNum || '-'}</p>
                </div>
                <div>
                    <p><strong>Down:</strong> ${atm.printer?.devices?.printerDown?.connected ? '✓' : '✗'} | 
                    Режим: ${atm.printer?.devices?.printerDown?.kktMode || '-'} | 
                    Смена: ${atm.printer?.devices?.printerDown?.kktShiftNum || '-'}</p>
                </div>
            </div>
        </div>
    `;

    // Банковские терминалы
    const bankInfo = `
        <div class="status-section">
            <h3>Банковские терминалы</h3>
            <div class="status-content">
                <div>
                    <p><strong>Up:</strong> ${formatDeviceStatus(atm.bank?.devices?.bankUp?.status)} | 
                    ${atm.bank?.devices?.bankUp?.connected ? '✓' : '✗'} | 
                    Банк: ${atm.bank?.devices?.bankUp?.connectToBankStatus || '-'}</p>
                </div>
                <div>
                    <p><strong>Down:</strong> ${formatDeviceStatus(atm.bank?.devices?.bankDown?.status)} | 
                    ${atm.bank?.devices?.bankDown?.connected ? '✓' : '✗'} | 
                    Банк: ${atm.bank?.devices?.bankDown?.connectToBankStatus || '-'}</p>
                </div>
            </div>
        </div>
    `;

    // Ридеры талонов
    const readerInfo = `
        <div class="status-section">
            <h3>Ридеры талонов</h3>
            <div class="status-content">
                <div>
                    <p><strong>Up:</strong> ${formatDeviceStatus(atm.ticketReader?.devices?.readerUp?.status)} | 
                    ${atm.ticketReader?.devices?.readerUp?.connected ? '✓' : '✗'} | 
                    ${atm.ticketReader?.devices?.readerUp?.enabled ? 'Активен' : 'Неактивен'}</p>
                </div>
                <div>
                    <p><strong>Down:</strong> ${formatDeviceStatus(atm.ticketReader?.devices?.readerDown?.status)} | 
                    ${atm.ticketReader?.devices?.readerDown?.connected ? '✓' : '✗'} | 
                    ${atm.ticketReader?.devices?.readerDown?.enabled ? 'Активен' : 'Неактивен'}</p>
                </div>
            </div>
        </div>
    `;

    // Хопер
    const hopperInfo = `
        <div class="status-section">
            <h3>Хопер</h3>
            <div class="status-content">
                <div>
                    <p>Статус: ${formatDeviceStatus(atm.hoper?.devices?.hoper?.status)} | 
                    ${atm.hoper?.connected ? '✓' : '✗'} | 
                    ${atm.hoper?.enabled ? 'Активен' : 'Неактивен'}</p>
                    <p>Монеты: ${formatCoins(atm.hoper?.nominals?.active)}</p>
                </div>
            </div>
        </div>
    `;

    // Ошибки
    const errorsInfo = `
        <div class="status-section">
            <h3>Активные ошибки</h3>
            ${formatErrors(data.errors)}
        </div>
    `;

    // Обновляем содержимое
    statusContainer.innerHTML = `
        <div class="status-header">
            <h2>Статус полосы</h2>
            <div class="status-controls">
                <button onclick="toggleStatusVisibility()" class="toggle-button" title="Свернуть/развернуть">▼</button>
                <button onclick="updateStatus()" class="refresh-button">Обновить</button>
                <button onclick="document.getElementById('status-container').remove()" class="close-button" title="Закрыть">✖</button>
            </div>
        </div>
        <div id="status-content" class="status-content-container">
            ${mainInfo}
            ${bnrInfo}
            ${printerInfo}
            ${bankInfo}
            ${readerInfo}
            ${hopperInfo}
            ${errorsInfo}
        </div>
    `;
}

// Функция для переключения видимости содержимого статуса
function toggleStatusVisibility() {
    const contentContainer = document.getElementById('status-content');
    const toggleButton = document.querySelector('.toggle-button');
    
    if (contentContainer) {
        if (contentContainer.style.display === 'none') {
            contentContainer.style.display = 'block';
            toggleButton.textContent = '▼';
            toggleButton.title = 'Свернуть';
        } else {
            contentContainer.style.display = 'none';
            toggleButton.textContent = '►';
            toggleButton.title = 'Развернуть';
        }
    }
}

// Экспортируем функцию в глобальную область
window.toggleStatusVisibility = toggleStatusVisibility;

// Вспомогательные функции форматирования
function formatLaneMode(mode) {
    const modes = {
        'autoWithoutPayment': 'Автоматический без оплаты',
        'auto': 'Автоматический',
        'manual': 'Ручной'
    };
    return modes[mode] || mode;
}

function formatDirection(direction) {
    const directions = {
        'forward': 'Прямое',
        'backward': 'Обратное'
    };
    return directions[direction] || direction;
}

function formatBarrierState(state) {
    const states = {
        'opened': 'Открыт',
        'closed': 'Закрыт'
    };
    return states[state] || state;
}

function formatLightState(state) {
    const states = {
        'red': 'Красный',
        'green': 'Зеленый'
    };
    return states[state] || state;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU');
}

function formatErrors(errors) {
    if (!errors || Object.keys(errors).length === 0) {
        return '<p>Нет активных ошибок</p>';
    }

    return Object.values(errors)
        .map(error => `
            <div class="error-item">
                <p><strong>${error.src}</strong> | ${error.description} | ${error.level} | ${formatDateTime(error.dt)}</p>
            </div>
        `)
        .join('');
}

// Добавляем новые вспомогательные функции форматирования
function formatDeviceStatus(status) {
    if (!status) return 'Нет данных';
    
    // Словарь для перевода статусов устройств
    const statusTranslations = {
        'idle': 'В ожидании',
        'accepting': 'Приём купюр',
        'Остановлен': 'Остановлен',
        'stopped': 'Остановлен',
        'error': 'Ошибка',
        'disabled': 'Отключен',
        'disconnected': 'Отключен',
        'processing': 'Обработка',
        'jammed': 'Замятие',
        'dispensing': 'Выдача',
        'ready': 'Готов'
    };
    
    // Возвращаем перевод если есть, иначе исходный статус
    return statusTranslations[status] || status;
}

function formatSafeStatus(status) {
    const states = {
        'opened': 'Открыт',
        'closed': 'Закрыт'
    };
    return states[status] || status || 'Нет данных';
}

// Добавляем новую функцию форматирования для монет
function formatCoins(coins) {
    if (!coins || Object.keys(coins).length === 0) return 'Нет';
    return Object.entries(coins)
        .map(([nominal, count]) => `${nominal}: ${count}`)
        .join(', ');
}

// Создание контейнера для статуса
function createStatusContainer() {
    const container = document.createElement('div');
    container.id = 'status-container';
    container.className = 'device-status-container';
    
    // Находим элемент terminal и вставляем контейнер перед ним
    const terminal = document.getElementById('terminal');
    if (terminal && terminal.parentNode) {
        terminal.parentNode.insertBefore(container, terminal);
    }
} 