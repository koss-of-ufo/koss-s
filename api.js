const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

// Добавляем CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.json());
// Добавляем раздачу статических файлов
app.use(express.static('.'));

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

// API endpoint для BNR Up
app.post('/api/bnr-up', async (req, res) => {
    try {
        const { command } = req.body;
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

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// API endpoint для BNR Down
app.post('/api/bnr-down', async (req, res) => {
    try {
        const { command } = req.body;
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

        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`API сервер запущен на порту ${port}`);
}); 