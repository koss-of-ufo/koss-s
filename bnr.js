const { exec } = require('child_process');

// Функция для выполнения команд
function executeCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(stdout);
        });
    });
}

// Функция для обработки BNR Up команд
async function handleBNRUp(command) {
    try {
        let result;

        if (command === 'start') {
            // Останавливаем сервис
            await executeCommand('pm2 stop BNRUp');
            
            // Читаем настройки
            const settings = await executeCommand('cat /var/megatoll/modules/bnrcontrol/up/bnr_settings.json');
            const match = settings.match(/"bnr_sn":"(\d+)"/);
            if (!match || !match[1]) {
                throw new Error('Серийный номер BNR не найден');
            }
            
            // Запускаем консоль
            result = await executeCommand(`echo -e "101\\n${match[1]}" | /root/bnr/BnrClientConsole`);
            
            // Перезапускаем сервис
            await executeCommand('pm2 start BNRUp');
            
            // Ждем и отправляем reset
            setTimeout(async () => {
                await executeCommand('curl "http://localhost:8121/reset"');
            }, 10000);
        } else {
            // Выполняем команду
            result = await executeCommand(`echo "${command}" | /root/bnr/BnrClientConsole`);
        }

        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Функция для обработки BNR Down команд
async function handleBNRDown(command) {
    try {
        let result;

        if (command === 'start') {
            // Останавливаем сервис
            await executeCommand('pm2 stop BNRDown');
            
            // Читаем настройки
            const settings = await executeCommand('cat /var/megatoll/modules/bnrcontrol/down/bnr_settings.json');
            const match = settings.match(/"bnr_sn":"(\d+)"/);
            if (!match || !match[1]) {
                throw new Error('Серийный номер BNR не найден');
            }
            
            // Запускаем консоль
            result = await executeCommand(`echo -e "101\\n${match[1]}" | /root/bnr/BnrClientConsole`);
            
            // Перезапускаем сервис
            await executeCommand('pm2 start BNRDown');
            
            // Ждем и отправляем reset
            setTimeout(async () => {
                await executeCommand('curl "http://localhost:8122/reset"');
            }, 10000);
        } else {
            // Выполняем команду
            result = await executeCommand(`echo "${command}" | /root/bnr/BnrClientConsole`);
        }

        return { success: true, result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    handleBNRUp,
    handleBNRDown
}; 