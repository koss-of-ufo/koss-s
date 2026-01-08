// Переменная для отслеживания, был ли инициирован перезапуск
let resetInitiated = false;

// Функция для проверки статуса зон и очереди
async function checkZonesAndSwap() {
    // Предотвращаем зацикливание
    console.log('Вызвана функция checkZonesAndSwap, resetInitiated =', resetInitiated);
    
    // Если перезапуск уже инициирован, не продолжаем
    if (resetInitiated) {
        console.log('Перезапуск уже инициирован, выходим из функции');
        return;
    }
    
    try {
        // Получаем IP из поля ввода
        const ip = document.getElementById('ip').value;
        
        if (!ip) {
            throw new Error('IP адрес не указан');
        }

        console.log('Проверка зон для IP:', ip);

        // Отображение статуса
        const statusDisplay = document.createElement('div');
        statusDisplay.id = 'swap-status';
        statusDisplay.style.cssText = 'margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px; position: relative;';
        
        // Добавляем кнопку закрытия
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✖';
        closeButton.style.cssText = 'position: absolute; top: 5px; right: 5px; background: none; border: none; font-size: 16px; cursor: pointer; padding: 0 5px;';
        closeButton.title = 'Закрыть';
        closeButton.onclick = function() {
            document.getElementById('swap-status').remove();
        };
        
        // Создаем контейнер для содержимого
        const contentDiv = document.createElement('div');
        contentDiv.id = 'swap-status-content';
        
        // Добавляем начальный текст
        const statusText = document.createElement('p');
        statusText.textContent = 'Проверка статуса зон...';
        contentDiv.appendChild(statusText);
        
        // Добавляем элементы в основной контейнер
        statusDisplay.appendChild(closeButton);
        statusDisplay.appendChild(contentDiv);
        
        // Удаляем существующий статус, если есть
        const existingStatus = document.getElementById('swap-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Отображаем статус в интерфейсе
        const terminal = document.getElementById('terminal');
        if (terminal && terminal.parentNode) {
            terminal.parentNode.insertBefore(statusDisplay, terminal);
        } else {
            document.body.appendChild(statusDisplay);
        }
        
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
                console.log('Получены данные о статусе:', data.data);
                
                // Проверяем состояние зон и очереди
                const entryZone = data.data.entryZone || 'unknown';
                const paymentZone = data.data.paymentZone || 'unknown';
                const exitZone = data.data.exitZone || 'unknown';
                const queue = data.data.queue || 'unknown';
                
                contentDiv.innerHTML = `
                    <h3>Статус зон</h3>
                    <p>Entry Zone: ${entryZone}</p>
                    <p>Payment Zone: ${paymentZone}</p>
                    <p>Exit Zone: ${exitZone}</p>
                    <p>Queue: ${queue}</p>
                `;
                
                // Проверяем соответствие всех условий
                if (entryZone === 'off' && paymentZone === 'off' && exitZone === 'off' && queue === '0') {
                    console.log('Все зоны свободны, очередь пуста. Выполняем перезапуск arm...');
                    contentDiv.innerHTML += '<p style="color: green; font-weight: bold;">Все зоны свободны, очередь пуста. Выполняем перезапуск arm...</p>';
                    
                    // Отправляем команду на перезапуск arm
                    sendResetSwap();
                } else {
                    console.log('Не все условия соблюдены для перезапуска arm.');
                    contentDiv.innerHTML += '<p style="color: orange;">Не все условия соблюдены для перезапуска arm.</p>';
                }
            } else {
                console.log('Нет данных в ответе:', data);
                contentDiv.innerHTML = '<p style="color: red;">Нет данных о статусе</p>';
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
        const statusDisplay = document.getElementById('swap-status');
        if (statusDisplay) {
            statusDisplay.innerHTML = '<p style="color: red;">Ошибка: ' + error.message + '</p>';
        }
    }
}

// Функция для отправки команды перезапуска arm
function sendResetSwap() {
    if (!window.socket || window.socket.readyState !== WebSocket.OPEN) {
        alert("Сначала подключитесь к SSH-серверу");
        return false;
    }
    
    // Устанавливаем флаг, что перезапуск инициирован
    resetInitiated = true;
    console.log("Устанавливаем флаг resetInitiated =", resetInitiated);
    
    window.socket.send("pm2 restart arm\n");
    console.log("Отправлена команда: pm2 restart arm");
    
    // Обновляем статус в интерфейсе
    const statusDisplay = document.getElementById('swap-status');
    const contentDiv = document.getElementById('swap-status-content');
    if (statusDisplay && contentDiv) {
        contentDiv.innerHTML += '<p style="color: blue; font-weight: bold;">Команда отправлена: pm2 restart arm</p>';
    }
    
    // Сбрасываем флаг через 10 секунд
    setTimeout(() => {
        resetInitiated = false;
        console.log("Сбрасываем флаг resetInitiated =", resetInitiated);
    }, 10000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('Инициализация скрипта swap.js');
    
    // Добавляем кнопку SWAP в main-controls
    const mainControlsBlock = document.querySelector('.main-controls');
    
    if (mainControlsBlock) {
        // Проверяем, существует ли уже кнопка SWAP ARM
        if (!document.querySelector('.swap-arm-button')) {
            const swapButton = document.createElement('button');
            swapButton.textContent = 'SWAP ARM';
            swapButton.className = 'submit-btn swap-arm-button';
            swapButton.title = 'Проверить зоны и перезапустить arm, если возможно';
            
            // Используем обработчик onclick вместо addEventListener
            swapButton.onclick = function() {
                checkZonesAndSwap();
            };
            
            mainControlsBlock.appendChild(swapButton);
            console.log('Кнопка SWAP ARM добавлена');
        } else {
            console.log('Кнопка SWAP ARM уже существует');
        }
    } else {
        console.warn('Блок main-controls не найден, невозможно добавить кнопку SWAP');
    }
});

// Экспортируем функции в глобальную область
window.checkZonesAndSwap = checkZonesAndSwap;
window.sendResetSwap = sendResetSwap; 