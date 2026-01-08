// Глобальная переменная для хранения экземпляра терминала
let terminalInstance = null;

// Функция для установки экземпляра терминала
function setTerminalInstance(term) {
    terminalInstance = term;
}

// Функция для получения keyCode по имени клавиши
function getKeyCode(key) {
    const keyCodes = {
        'ArrowUp': 38,
        'ArrowDown': 40,
        'ArrowLeft': 37,
        'ArrowRight': 39,
        'Enter': 13,
        'Escape': 27,
        'Tab': 9,
        '/': 191,
        'F1': 112,
        'F2': 113,
        'F3': 114,
        'F4': 115,
        'F5': 116,
        'F6': 117,
        'F7': 118,
        'F8': 119,
        'F9': 120,
        'F10': 121,
        'F11': 122,
        'F12': 123
    };
    return keyCodes[key] || 0;
}

// Инициализация обработчиков событий для кнопок терминала
function initTerminalControls() {
    const terminalButtons = document.querySelectorAll('.term-btn');
    
    terminalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const key = this.getAttribute('data-key');
            if (!key || this.classList.contains('invisible')) return;
            
            if (terminalInstance && terminalInstance.textarea) {
                // Создаем событие нажатия клавиши
                const event = new KeyboardEvent('keydown', {
                    key: key,
                    code: key,
                    keyCode: getKeyCode(key),
                    which: getKeyCode(key),
                    bubbles: true,
                    cancelable: true
                });
                
                // Отправляем событие в терминал
                terminalInstance.textarea.dispatchEvent(event);
            }
        });
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', initTerminalControls); 