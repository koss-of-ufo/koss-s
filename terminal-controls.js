// Глобальная переменная для хранения экземпляра терминала
let terminalInstance = null;

// Функция для установки экземпляра терминала
function setTerminalInstance(term) {
    terminalInstance = term;
}

const keySequences = {
    ArrowUp: '\x1b[A',
    ArrowDown: '\x1b[B',
    ArrowRight: '\x1b[C',
    ArrowLeft: '\x1b[D',
    Enter: '\r',
    Escape: '\x1b',
    Tab: '\t',
    Backspace: '\x7f',
    F1: '\x1bOP',
    F2: '\x1bOQ',
    F3: '\x1bOR',
    F4: '\x1bOS',
    F5: '\x1b[15~',
    F6: '\x1b[17~',
    F7: '\x1b[18~',
    F8: '\x1b[19~',
    F9: '\x1b[20~',
    F10: '\x1b[21~',
    F11: '\x1b[23~',
    F12: '\x1b[24~'
};

function sendToTerminal(data) {
    if (!data) return;
    if (window.socket && window.socket.readyState === WebSocket.OPEN) {
        window.socket.send(data);
        if (terminalInstance) {
            terminalInstance.focus();
        }
        return;
    }
    if (terminalInstance) {
        terminalInstance.write(data);
        terminalInstance.focus();
    }
}

function handleManualInputSend() {
    const input = document.getElementById('terminal-manual-input');
    if (!input) return;
    if (!input.value) return;
    sendToTerminal(`${input.value}\r`);
    input.value = '';
}

async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        if (text) {
            sendToTerminal(text);
        }
    } catch (error) {
        console.warn('Не удалось получить буфер обмена:', error);
    }
}

// Инициализация обработчиков событий для кнопок терминала
function initTerminalControls() {
    const terminalButtons = document.querySelectorAll('.term-btn');
    const terminalContainer = document.getElementById('terminal');
    const manualInput = document.getElementById('terminal-manual-input');

    if (terminalContainer) {
        terminalContainer.addEventListener('pointerdown', () => {
            if (terminalInstance) {
                terminalInstance.focus();
            }
        });
    }

    if (manualInput) {
        manualInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleManualInputSend();
            }
        });
    }

    terminalButtons.forEach(button => {
        if (button.classList.contains('invisible')) return;

        const repeatable = button.dataset.repeat === 'true';
        let repeatTimer = null;
        let repeatDelayTimer = null;

        const sendForButton = () => {
            const action = button.dataset.action;
            if (action === 'send-input') {
                handleManualInputSend();
                return;
            }
            if (action === 'paste') {
                handlePaste();
                return;
            }

            const key = button.dataset.key;
            const sequence = button.dataset.seq;
            const text = button.dataset.text;

            if (sequence) {
                sendToTerminal(sequence);
                return;
            }

            if (text) {
                sendToTerminal(text);
                return;
            }

            if (key && keySequences[key]) {
                sendToTerminal(keySequences[key]);
            }
        };

        button.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            sendForButton();
            if (repeatable) {
                repeatDelayTimer = window.setTimeout(() => {
                    repeatTimer = window.setInterval(sendForButton, 80);
                }, 250);
            }
        });

        const stopRepeat = () => {
            if (repeatDelayTimer) {
                window.clearTimeout(repeatDelayTimer);
                repeatDelayTimer = null;
            }
            if (repeatTimer) {
                window.clearInterval(repeatTimer);
                repeatTimer = null;
            }
        };

        button.addEventListener('pointerup', stopRepeat);
        button.addEventListener('pointerleave', stopRepeat);
        button.addEventListener('pointercancel', stopRepeat);
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initTerminalControls); 
