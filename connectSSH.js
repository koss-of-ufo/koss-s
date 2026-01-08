// Глобальная переменная для WebSocket соединения
window.socket = null;
// Глобальный массив для обработчиков сообщений WebSocket
window.webSocketMessageHandlers = [];

let term;
let fitAddon;
let reconnectAttempts = 0;
let isConnected = false;
let ssh;

function connectSSH() {
    let host = document.getElementById("ip").value;
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if (!host || !username || !password) {
      alert("Введите IP, имя пользователя и пароль");
      return;
    }

    // Закрываем существующее соединение, если оно есть
    if (window.socket) {
        console.log("Закрываем существующее соединение...");
        window.socket.onclose = null; // Отключаем обработчик закрытия
        window.socket.close();
        window.socket = null;
        
        // Ждем немного перед созданием нового соединения
        setTimeout(() => {
            createNewConnection(host, username, password);
        }, 500);
    } else {
        createNewConnection(host, username, password);
    }
}

function createNewConnection(host, username, password) {
    console.log("Создаем новое соединение...");
    
    // Создаем новое соединение
    window.socket = new WebSocket("ws://192.168.11.90:3000");

    window.socket.onopen = function () {
        console.log("WebSocket соединение установлено");
        reconnectAttempts = 0;
        // Отправляем данные для SSH подключения
        window.socket.send(JSON.stringify({ 
            type: 'ssh_connect',
            host, 
            username, 
            password 
        }));
        
        // Вызываем функции регистрации обработчиков ПОСЛЕ установки соединения
        if (typeof window.registerBnrDownMessageHandler === 'function') {
            console.log("Calling registerBnrDownMessageHandler...");
            window.registerBnrDownMessageHandler();
        }
        if (typeof window.registerBnrUpMessageHandler === 'function') {
            console.log("Calling registerBnrUpMessageHandler...");
            window.registerBnrUpMessageHandler();
        }
        
        // Инициализируем DeviceStatusManager после успешного подключения
        if (typeof DeviceStatusManager !== 'undefined' && !window.deviceStatusManager) {
            window.deviceStatusManager = new DeviceStatusManager();
        }
        
        isConnected = true;
    };

    window.socket.onmessage = function (event) {
        const data = event.data;
        // Более детальное логирование
        console.log(`Получены данные: Type=${typeof data}, Length=${data ? data.length : 'N/A'}, Content="${data}"`);

        try {
            // Сначала проверяем на статус-ответ, чтобы избежать ненужного парсинга
            // Достаточно простой проверки строки перед полным парсингом
            if (typeof data === 'string' && data.includes('"type":"status_response"')) {
                 const jsonData = JSON.parse(data); // Парсим только если похоже на JSON
                 if (jsonData.type === 'status_response') {
                     console.log('Обработка как status_response');
                     if (window.deviceStatusManager) {
                         window.deviceStatusManager.handleStatusResponse(jsonData);
                     }
                     return; // Важно: прекращаем обработку, если это статус
                 }
            }
        } catch (e) {
            // Ошибка парсинга JSON - игнорируем, т.к. это может быть обычный текст
            // console.error('Ошибка парсинга возможного JSON (ожидаемо для текста):', e);
        }

        // Вызываем все зарегистрированные обработчики
        if (window.webSocketMessageHandlers && Array.isArray(window.webSocketMessageHandlers)) {
            console.log(`Calling ${window.webSocketMessageHandlers.length} WebSocket message handlers.`);
            window.webSocketMessageHandlers.forEach(handler => {
                try {
                    handler(data);
                } catch (handlerError) {
                    console.error("Error in WebSocket message handler:", handlerError);
                }
            });
        }

        // Если это не статус-ответ (или невалидный JSON), пишем в терминал
        if (term) {
            // Добавляем лог прямо перед записью в терминал
            console.log(`Запись в терминал: Content="${data}"`);
            term.write(data);
            // Прокручиваем терминал вниз после записи данных
            term.scrollToBottom();
        } else {
            console.warn("Терминал не инициализирован, не могу записать данные:", data);
        }
    };

    window.socket.onerror = function (error) {
        console.error("Ошибка WebSocket:", error);
        alert("Ошибка соединения с сервером SSH");
        isConnected = false;
    };

    window.socket.onclose = function () {
        console.log("WebSocket соединение закрыто");
        isConnected = false;
        if (reconnectAttempts < 5) {
            setTimeout(function () {
                console.log("Попытка переподключения WebSocket...");
                createNewConnection(host, username, password);
                reconnectAttempts++;
            }, 3000);
        } else {
            alert("Не удаётся переподключиться. Попробуйте снова позже.");
        }
    };

    // Инициализируем терминал
    if (!term) {
        term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Consolas, monospace',
            theme: {
                background: '#000000',
                foreground: '#ffffff'
            }
        });
        
        // Устанавливаем экземпляр терминала для управления
        setTerminalInstance(term);
        
        // Добавляем FitAddon для автоматического изменения размера терминала
        fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        
        // Открываем терминал
        const terminalContainer = document.getElementById("terminal");
        term.open(terminalContainer);
        term.focus();
        if (terminalContainer && !terminalContainer.dataset.focusBound) {
            terminalContainer.addEventListener('pointerdown', () => term.focus());
            terminalContainer.dataset.focusBound = 'true';
        }
        
        // Применяем FitAddon для правильного отображения
        const updateTerminalSize = () => {
            if (fitAddon) {
                try {
                    fitAddon.fit();
                    const dims = fitAddon.proposeDimensions();
                    if (dims) {
                        term.resize(dims.cols, dims.rows);
                        // Добавляем небольшую задержку для повторного применения размеров
                        setTimeout(() => {
                            fitAddon.fit();
                            term.scrollToBottom();
                        }, 50);
                    }
                } catch (e) {
                    console.error('Error updating terminal size:', e);
                }
            }
        };

        setTimeout(updateTerminalSize, 100);
        
        // Обработчик изменения размера окна для подстройки терминала
        window.addEventListener('resize', updateTerminalSize);
        
        // Настраиваем обработку ввода через term.onData
        term.onData((data) => {
            console.log('Отправляем данные в терминал:', data);
            if (window.socket && window.socket.readyState === WebSocket.OPEN) {
                window.socket.send(data);
            }
        });

        // Очищаем терминал при новом подключении
        term.clear();
        term.writeln("Терминал инициализирован. Подключитесь к устройству для начала работы.");
        term.scrollToBottom();
    } else {
        // Очищаем терминал для нового подключения
        term.clear();
        // Обновляем размер терминала
        if (fitAddon) {
            fitAddon.fit();
        }
        term.scrollToBottom();
    }
}

// Экспортируем функцию в глобальную область
window.connectSSH = connectSSH;
window.isConnected = isConnected;

// Инициализируем терминал при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (!term) {
        term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            fontFamily: 'Consolas, monospace',
            theme: {
                background: '#000000',
                foreground: '#ffffff'
            }
        });
        
        // Устанавливаем экземпляр терминала для управления
        setTerminalInstance(term);
        
        // Добавляем FitAddon для автоматического изменения размера терминала
        fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        
        // Открываем терминал
        const terminalContainer = document.getElementById("terminal");
        term.open(terminalContainer);
        term.focus();
        if (terminalContainer && !terminalContainer.dataset.focusBound) {
            terminalContainer.addEventListener('pointerdown', () => term.focus());
            terminalContainer.dataset.focusBound = 'true';
        }
        
        // Применяем FitAddon для правильного отображения
        const updateTerminalSize = () => {
            if (fitAddon) {
                try {
                    fitAddon.fit();
                    const dims = fitAddon.proposeDimensions();
                    if (dims) {
                        term.resize(dims.cols, dims.rows);
                        // Добавляем небольшую задержку для повторного применения размеров
                        setTimeout(() => {
                            fitAddon.fit();
                            term.scrollToBottom();
                        }, 50);
                    }
                } catch (e) {
                    console.error('Error updating terminal size:', e);
                }
            }
        };

        setTimeout(updateTerminalSize, 100);
        
        // Обработчик изменения размера окна для подстройки терминала
        window.addEventListener('resize', updateTerminalSize);
        
        // Настраиваем обработку ввода через term.onData
        term.onData((data) => {
            console.log('Отправляем данные в терминал:', data);
            if (window.socket && window.socket.readyState === WebSocket.OPEN) {
                window.socket.send(data);
            }
        });
        
        term.writeln("Терминал инициализирован. Подключитесь к устройству для начала работы.");
        term.scrollToBottom();
    }
});
