/**
 * Скрипт для выполнения команд банковских модулей
 */

// Вспомогательная функция для отправки команд
function sendCommand(command) {
    if (!window.socket || window.socket.readyState !== WebSocket.OPEN) {
        alert("Сначала подключитесь к устройству по SSH");
        return false;
    }
    
    console.log('Отправляем команду:', command);
    window.socket.send(command + "\n");
    return true;
}

// Функция для отправки команды для банковского модуля UP
function sendBankCommandUp() {
    const command = "/var/megatoll/modules/bankatm/up/gcsgatew 15 8 24";
    sendCommand(command);
}

// Функция для отправки команды для банковского модуля DOWN
function sendBankCommandDown() {
    const command = "/var/megatoll/modules/bankatm/down/gcsgatew 15 8 24";
    sendCommand(command);
}

// Функция для чтения файла результатов Bank Up
function readBankUpResult() {
    const command = "cat /var/megatoll/modules/bankatm/up/aresult.txt | iconv -c -f WINDOWS-1251 -t UTF-8";
    sendCommand(command);
}

// Функция для чтения файла результатов Bank Down
function readBankDownResult() {
    const command = "cat /var/megatoll/modules/bankatm/down/aresult.txt | iconv -c -f WINDOWS-1251 -t UTF-8";
    sendCommand(command);
}

// Экспортируем функции в глобальную область видимости
document.addEventListener('DOMContentLoaded', () => {
    window.sendBankCommandUp = sendBankCommandUp;
    window.sendBankCommandDown = sendBankCommandDown;
    window.readBankUpResult = readBankUpResult;
    window.readBankDownResult = readBankDownResult;
}); 