// Конфигурация устройств
const devices = [
    { name: 'BNR-верх', port: 8121, endpoint: 'getStatus' },
    { name: 'BNR-низ', port: 8122, endpoint: 'getStatus' },
    { name: 'Хопер', port: 8106, endpoint: 'getStatus' },
    { name: 'Принтер', port: 8104, endpoint: 'getstatus' },
    { name: 'IO', port: 8101, endpoint: 'getStatus' },
    { name: 'Банковский терминал', port: 8110, endpoint: 'getStatus' },
    { name: 'Тикет-ридер', port: 8107, endpoint: 'getStatus' }
];

class DeviceStatusManager {
    constructor() {
        this.statusContainer = null;
        this.pendingUpdates = new Map();
        this.initializeStatusContainer();
        this.setupWebSocketListener();
    }

    initializeStatusContainer() {
        this.statusContainer = document.createElement('div');
        this.statusContainer.id = 'device-status';
        this.statusContainer.className = 'device-status-container';

        const header = document.createElement('div');
        header.className = 'status-header';

        const title = document.createElement('h2');
        title.textContent = 'Статус устройств';

        const refreshButton = document.createElement('button');
        refreshButton.textContent = 'Обновить все';
        refreshButton.className = 'refresh-button';
        refreshButton.onclick = () => this.updateAllStatuses();

        header.appendChild(title);
        header.appendChild(refreshButton);
        this.statusContainer.appendChild(header);

        const table = document.createElement('table');
        table.className = 'status-table';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Устройство</th>
                <th>Статус</th>
                <th>Обновлено</th>
                <th>Действия</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        devices.forEach(device => {
            const tr = document.createElement('tr');
            tr.id = `status-${device.name}`;

            const refreshButton = document.createElement('button');
            refreshButton.textContent = '🔄';
            refreshButton.className = 'refresh-button-small';
            refreshButton.onclick = () => this.updateDeviceStatus(device);

            tr.innerHTML = `
                <td>${device.name}</td>
                <td class="status">Нет данных</td>
                <td class="timestamp">-</td>
                <td class="actions"></td>
            `;
            tr.querySelector('.actions').appendChild(refreshButton);
            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        this.statusContainer.appendChild(table);
        document.body.appendChild(this.statusContainer);
    }

    setupWebSocketListener() {
        if (!window.socket) return;

        window.socket.addEventListener('message', (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                console.error('Невалидный JSON:', event.data);
                return;
            }

            if (data.type === 'status_response' && data.device) {
                const deviceName = data.device;
                this.updateStatusInfo(deviceName, data.error ? { error: data.error } : data.data);
                this.pendingUpdates.delete(deviceName);
            }
        });
    }

    async updateDeviceStatus(device) {
        const ip = document.getElementById('ip')?.value;
        if (!ip) return this.updateStatusInfo(device.name, { error: 'IP адрес не указан' });
        if (!window.socket || window.socket.readyState !== WebSocket.OPEN) {
            return this.updateStatusInfo(device.name, { error: 'WebSocket не подключен' });
        }

        const statusRow = document.getElementById(`status-${device.name}`);
        if (statusRow) {
            const statusCell = statusRow.querySelector('.status');
            statusCell.textContent = 'Обновление...';
            statusCell.className = 'status status-unknown';
        }

        const request = {
            type: 'status_request',
            device: device.name,
            url: `http://${ip}:${device.port}/${device.endpoint}`
        };
        window.socket.send(JSON.stringify(request));
        this.pendingUpdates.set(device.name, Date.now());

        setTimeout(() => {
            if (this.pendingUpdates.has(device.name)) {
                this.updateStatusInfo(device.name, { error: 'Превышено время ожидания (5 сек)' });
                this.pendingUpdates.delete(device.name);
            }
        }, 5000);
    }

    updateStatusInfo(deviceName, data) {
        const statusRow = document.getElementById(`status-${deviceName}`);
        if (!statusRow) return;

        const statusCell = statusRow.querySelector('.status');
        const timestampCell = statusRow.querySelector('.timestamp');

        if (data.error) {
            statusCell.textContent = `Ошибка: ${data.error}`;
            statusCell.className = 'status status-error';
            timestampCell.textContent = new Date().toLocaleTimeString();
            return;
        }

        try {
            const formattedStatus = this.formatStatusObject(this.extractStatusData(data));
            statusCell.textContent = formattedStatus;
            statusCell.className = 'status ' + this.getStatusClass(data);
            timestampCell.textContent = new Date().toLocaleTimeString();
        } catch (error) {
            statusCell.textContent = `Ошибка форматирования: ${error.message}`;
            statusCell.className = 'status status-error';
            timestampCell.textContent = new Date().toLocaleTimeString();
        }
    }

    extractStatusData(data) {
        if (!data.ATM) return {};
        const atm = data.ATM;
        const result = {};

        if (atm.BNRUp) result.BNRUp = {
            status: atm.BNRUp.devices.BNRup.status,
            connected: atm.BNRUp.connected ? 'Подключен' : 'Отключен',
            enabled: atm.BNRUp.enabled ? 'Активен' : 'Неактивен',
            safeDoor: atm.BNRUp.devices.BNRup.safeDoorStatus
        };

        if (atm.BNRDown) result.BNRDown = {
            status: atm.BNRDown.devices.BNRdown.status,
            connected: atm.BNRDown.connected ? 'Подключен' : 'Отключен',
            enabled: atm.BNRDown.enabled ? 'Активен' : 'Неактивен',
            safeDoor: atm.BNRDown.devices.BNRdown.safeDoorStatus
        };

        if (atm.hoper) result.hopper = {
            status: atm.hoper.devices.hoper.status,
            connected: atm.hoper.connected ? 'Подключен' : 'Отключен',
            enabled: atm.hoper.enabled ? 'Активен' : 'Неактивен'
        };

        if (atm.printer) result.printer = {
            connected: atm.printer.connected ? 'Подключен' : 'Отключен',
            enabled: atm.printer.enabled ? 'Активен' : 'Неактивен',
            upStatus: `${atm.printer.devices.printerUp.kktMode}, ${atm.printer.devices.printerUp.kktSubMode}`,
            downStatus: `${atm.printer.devices.printerDown.kktMode}, ${atm.printer.devices.printerDown.kktSubMode}`
        };

        if (atm.io) result.io = {
            connected: atm.io.controllerConnected ? 'Подключен' : 'Отключен',
            enabled: atm.io.enabled ? 'Активен' : 'Неактивен'
        };

        if (atm.bank) result.bank = {
            connected: atm.bank.connected ? 'Подключен' : 'Отключен',
            enabled: atm.bank.enabled ? 'Активен' : 'Неактивен',
            upStatus: atm.bank.devices.bankUp.status,
            downStatus: atm.bank.devices.bankDown.status
        };

        if (atm.ticketReader) result.ticketReader = {
            connected: atm.ticketReader.connected ? 'Подключен' : 'Отключен',
            enabled: atm.ticketReader.enabled ? 'Активен' : 'Неактивен',
            upStatus: atm.ticketReader.devices.readerUp.status,
            downStatus: atm.ticketReader.devices.readerDown.status
        };

        return result;
    }

    formatStatusObject(statusObj) {
        return Object.entries(statusObj).map(([device, info]) => {
            const lines = Object.entries(info).map(([k, v]) => `  ${k}: ${v}`).join('\n');
            return `${device}:\n${lines}`;
        }).join('\n\n');
    }

    getStatusClass(data) {
        try {
            if (data.queryStatus && data.queryStatus.error !== 0) return 'status-error';
            if (!data.ATM) return 'status-unknown';

            const atm = data.ATM;
            const connections = [atm.BNRUp, atm.BNRDown, atm.hoper, atm.printer, atm.io, atm.bank, atm.ticketReader]
                .map(d => d?.connected ?? true);
            const enabled = [atm.BNRUp, atm.BNRDown, atm.hoper, atm.printer, atm.io, atm.bank, atm.ticketReader]
                .map(d => d?.enabled ?? true);

            if (connections.includes(false)) return 'status-error';
            if (enabled.includes(false)) return 'status-warning';

            return 'status-ok';
        } catch {
            return 'status-error';
        }
    }

    async updateAllStatuses() {
        for (const device of devices) {
            await this.updateDeviceStatus(device);
        }
    }
}

if (window.socket) {
    window.socket.addEventListener('open', () => {
        window.deviceStatusManager = new DeviceStatusManager();
    });
} else {
    window.addEventListener('load', () => {
        window.deviceStatusManager = new DeviceStatusManager();
    });
}