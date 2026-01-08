// Глобальная переменная для WebSocket соединения
let socket = null;
// Флаг для предотвращения множественных нажатий
let commandInProgress = false;

// Открытие WebSocket-соединения
function connectSocket() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    socket = new WebSocket('ws://192.168.11.90:3000');
    socket.onopen = () => {
      console.log('Подключение установлено');
      // Вызываем обновление статуса после подключения
      if (window.updateStatus) {
        window.updateStatus();
      }
    };
    socket.onclose = () => {
      console.log('Подключение закрыто');
    };
    socket.onerror = (error) => {
      console.error('Ошибка WebSocket:', error);
    };
  }
}

// Функция для отправки команды с проверкой соединения
function sendCommand(command) {
  if (!window.socket || window.socket.readyState !== WebSocket.OPEN) {
    alert("Сначала подключитесь к SSH-серверу");
    return false;
  }
  
  console.log('Отправляем команду:', command);
  window.socket.send(command + "\n");
  return true;
}

// Отправка PM2 list
function sendPM2List() {
  sendCommand("pm2 ls");
}

// Перезагрузка драйверов Moxa
function sendRebootCommandsMoxa() {
  if (!sendCommand("pm2 stop all")) return;

  const commands = [
    "modprobe -r mxuport",
    "modprobe mxuport",
    "pm2 start all"
  ];

  let delay = 0;
  const delayStep = 1000;

  commands.forEach((cmd) => {
    setTimeout(() => {
      sendCommand(cmd);
      console.log(`Команда отправлена: ${cmd}`);
    }, delay);
    delay += delayStep;
  });
}

// Функция для перезагрузки выбранного модуля
function restartModule(moduleName) {
  if (sendCommand(`pm2 restart ${moduleName}`)) {
    console.log(`Модуль ${moduleName} перезагружается`);
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // Инициализация WebSocket
  connectSocket();

  // Обработчик для кнопки перезагрузки модуля
  const restartModuleBtn = document.getElementById('restartModuleBtn');
  if (restartModuleBtn) {
    restartModuleBtn.addEventListener('click', function() {
      const moduleButtons = document.querySelector('.module-buttons');
      if (moduleButtons) {
        moduleButtons.style.display = moduleButtons.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // Экспортируем новые функции в глобальную область
  window.sendBNRUpReset = sendBNRUpReset;
  window.sendBNRDownReset = sendBNRDownReset;
  window.sendBNRUpStopemerg = sendBNRUpStopemerg;
  window.sendBNRDownStopemerg = sendBNRDownStopemerg;
});

// Отправка BNRUpReset
function sendBNRUpReset() {
  if (commandInProgress) {
    console.log('Команда уже выполняется, ждите...');
    return;
  }

  commandInProgress = true;
  const btn = document.querySelector('button[onclick="sendBNRUpReset()"]');
  if (btn) btn.disabled = true;

  sendCommand('curl "http://localhost:8121/reset"');
  
  setTimeout(() => {
    commandInProgress = false;
    if (btn) btn.disabled = false;
  }, 2000);
}

// Отправка BNRDownReset
function sendBNRDownReset() {
  if (commandInProgress) {
    console.log('Команда уже выполняется, ждите...');
    return;
  }

  commandInProgress = true;
  const btn = document.querySelector('button[onclick="sendBNRDownReset()"]');
  if (btn) btn.disabled = true;

  sendCommand('curl "http://localhost:8122/reset"');
  
  setTimeout(() => {
    commandInProgress = false;
    if (btn) btn.disabled = false;
  }, 2000);
}

// Отправка BNR-Up вывод из оплаты
function sendBNRUpStopemerg() {
  // Проверяем, выполняется ли уже команда
  if (commandInProgress) {
    console.log('Команда уже выполняется, ждите...');
    return;
  }

  // Устанавливаем флаг блокировки и отключаем кнопку
  commandInProgress = true;
  const btn = document.querySelector('button[onclick="sendBNRUpStopemerg()"]');
  if (btn) btn.disabled = true;

  // Проверяем соединение
  if (!window.socket || window.socket.readyState !== WebSocket.OPEN) {
    alert("Сначала подключитесь к SSH-серверу");
    commandInProgress = false;
    if (btn) btn.disabled = false;
    return;
  }

  console.log("Отправляем только команду: curl \"http://localhost:8121/stopemerg\"");
  
  // Прямая отправка команды, без setTimeout и обработчиков
  window.socket.send("curl \"http://localhost:8121/stopemerg\"\n");
  
  // Ожидаем выполнения команды и разблокируем интерфейс
  setTimeout(() => {
    commandInProgress = false;
    if (btn) btn.disabled = false;
    console.log("Команда curl выполнена, блокировка снята");
  }, 1500);
}

// Отправка BNR-Down вывод из оплаты
function sendBNRDownStopemerg() {
  // Проверяем, выполняется ли уже команда
  if (commandInProgress) {
    console.log('Команда уже выполняется, ждите...');
    return;
  }

  // Устанавливаем флаг блокировки и отключаем кнопку
  commandInProgress = true;
  const btn = document.querySelector('button[onclick="sendBNRDownStopemerg()"]');
  if (btn) btn.disabled = true;

  // Проверяем соединение
  if (!window.socket || window.socket.readyState !== WebSocket.OPEN) {
    alert("Сначала подключитесь к SSH-серверу");
    commandInProgress = false;
    if (btn) btn.disabled = false;
    return;
  }

  console.log("Отправляем только команду: curl \"http://localhost:8122/stopemerg\"");
  
  // Прямая отправка команды, без setTimeout и обработчиков
  window.socket.send("curl \"http://localhost:8122/stopemerg\"\n");
  
  // Ожидаем выполнения команды и разблокируем интерфейс
  setTimeout(() => {
    commandInProgress = false;
    if (btn) btn.disabled = false;
    console.log("Команда curl выполнена, блокировка снята");
  }, 1500);
}

// Экспортируем основные функции в глобальную область
window.sendPM2List = sendPM2List;
window.sendRebootCommandsMoxa = sendRebootCommandsMoxa;
window.restartModule = restartModule;
window.commandInProgress = commandInProgress;