// Инициализация терминала
let terminal;
document.addEventListener('DOMContentLoaded', () => {
    terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'monospace',
        theme: {
            background: '#1e1e1e',
            foreground: '#d4d4d4'
        }
    });
    
    const fitAddon = new FitAddon.FitAddon();
    terminal.loadAddon(fitAddon);
    
    terminal.open(document.getElementById('terminal'));
    fitAddon.fit();
    
    // Обработка изменения размера окна
    window.addEventListener('resize', () => {
        fitAddon.fit();
    });
});

// Функция для отправки команды BNR Up
async function sendBNRUpCommand(command) {
    try {
        const response = await fetch('/api/bnr-up', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command }),
        });
        
        const data = await response.json();
        if (data.success) {
            writeToTerminal(data.result);
        } else {
            writeToTerminal(`Ошибка: ${data.error}`);
        }
    } catch (error) {
        writeToTerminal(`Ошибка при отправке команды: ${error.message}`);
    }
}

// Функция для отправки команды BNR Down
async function sendBNRDownCommand(command) {
    try {
        const response = await fetch('/api/bnr-down', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command }),
        });
        
        const data = await response.json();
        if (data.success) {
            writeToTerminal(data.result);
        } else {
            writeToTerminal(`Ошибка: ${data.error}`);
        }
    } catch (error) {
        writeToTerminal(`Ошибка при отправке команды: ${error.message}`);
    }
}

// Функция для записи в терминал
function writeToTerminal(text) {
    if (terminal) {
        terminal.writeln(text);
    }
}

// Обработчики для кнопок BNR Up
document.getElementById('startBtnUp').addEventListener('click', () => {
    sendBNRUpCommand('start');
});

// Обработчики для кнопок BNR Down
document.getElementById('startBtnDown').addEventListener('click', () => {
    sendBNRDownCommand('start');
});

// Функции для выполнения команд
function executeCommandUp(command) {
    sendBNRUpCommand(command.toString());
}

function executeCommandDown(command) {
    sendBNRDownCommand(command.toString());
}

// Функции для завершения процесса
function finishProcessUp() {
    sendBNRUpCommand('0');
}

function finishProcessDown() {
    sendBNRDownCommand('0');
} 