const { exec } = require('child_process');
const readline = require('readline');

// Создаем интерфейс для чтения ввода пользователя
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Функция для выполнения команд в оболочке
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

// Функция для чтения настроек BNR из файла
async function readBNRSettings() {
    try {
        const settings = await executeCommand('cat /var/megatoll/modules/bnrcontrol/up/bnr_settings.json');
        const match = settings.match(/"bnr_sn":"(\d+)"/);
        if (match && match[1]) {
            return match[1];
        }
        throw new Error('Серийный номер BNR не найден');
    } catch (error) {
        console.error('Ошибка при чтении настроек BNR:', error);
        process.exit(1);
    }
}

// Функция для взаимодействия с консолью BNR
async function handleBNRConsole(serialNumber) {
    console.log('Запуск консоли BNR...');
    
    const bnrProcess = exec('/root/bnr/BnrClientConsole');
    
    // Вводим команду 101 (выбор БНР по серийнику)
    bnrProcess.stdin.write('101\n');
    // Вводим серийный номер
    bnrProcess.stdin.write(serialNumber + '\n');
    
    // Обработка вывода консоли
    bnrProcess.stdout.on('data', (data) => {
        console.log(data.toString());
    });
    
    // Обработка ошибок
    bnrProcess.stderr.on('data', (data) => {
        console.error(data.toString());
    });
    
    // Обработка ввода пользователя
    rl.on('line', (input) => {
        if (input === '0') {
            // Выход из консоли
            bnrProcess.stdin.write('0\n');
            bnrProcess.kill();
            rl.close();
        } else {
            // Передача команды в консоль
            bnrProcess.stdin.write(input + '\n');
        }
    });
}

// Основная функция
async function main() {
    try {
        // Останавливаем сервис BNRUp
        await executeCommand('pm2 stop BNRUp');
        
        // Читаем настройки и получаем серийный номер
        const serialNumber = await readBNRSettings();
        console.log('Серийный номер BNR:', serialNumber);
        
        // Запускаем консоль BNR
        await handleBNRConsole(serialNumber);
        
        // Запускаем сервис BNRUp
        await executeCommand('pm2 start BNRUp');
        
        // Ждем 10 секунд и отправляем команду сброса
        setTimeout(async () => {
            await executeCommand('curl "http://localhost:8121/reset"');
            console.log('Команда сброса отправлена BNR Up');
        }, 10000);
        
    } catch (error) {
        console.error('Ошибка:', error);
        process.exit(1);
    }
}

main();

