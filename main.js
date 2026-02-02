const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const axios = require('axios');
const { machineIdSync } = require('node-machine-id');

let win;
let tray = null;
let isQuiting = false;

const hwid = machineIdSync();

// --- СЕКРЕТНЫЕ ДАННЫЕ УДАЛЕНЫ ДЛЯ БЕЗОПАСНОСТИ ---
const KEYS_URL = "ССЫЛКА_НА_ВАШ_GIST_С_КЛЮЧАМИ";
const vlessLink = "ВАША_VLESS_ССЫЛКА";

// ПУТЬ К ФАЙЛУ ПАМЯТИ
const licenseFilePath = path.join(app.getPath('userData'), 'license.txt');

// 1. ОТПРАВКА HWID
ipcMain.on('get-hwid', (event) => { event.reply('hwid-data', hwid); });

// 2. ПРОВЕРКА ЛИЦЕНЗИИ (КЛЮЧ:ID)
ipcMain.on('check-license', async (event, userKey) => {
    try {
        const response = await axios.get(KEYS_URL);
        const validPairs = response.data.split('\n').map(k => k.trim());
        if (validPairs.includes(`${userKey}:${hwid}`)) {
            fs.writeFileSync(licenseFilePath, userKey);
            event.reply('license-result', true);
        } else {
            event.reply('license-result', false);
        }
    } catch (e) { event.reply('license-result', false); }
});

// 3. ЗАГРУЗКА ПАМЯТИ
ipcMain.on('load-saved-key', (event) => {
    if (fs.existsSync(licenseFilePath)) {
        event.reply('key-loaded', fs.readFileSync(licenseFilePath, 'utf8'));
    }
});

function createWindow() {
    win = new BrowserWindow({
        width: 400, height: 750, resizable: false,
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: { nodeIntegration: true, contextIsolation: false },
        autoHideMenuBar: true
    });
    win.loadFile(path.join(__dirname, 'view.html'));
    win.on('close', (event) => { if (!isQuiting) { event.preventDefault(); win.hide(); } });

    tray = new Tray(path.join(__dirname, 'icon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Показать ABBVPN', click: () => win.show() },
        { type: 'separator' },
        { label: 'Выход', click: () => { isQuiting = true; app.quit(); } }
    ]);
    tray.setToolTip('ABBVPN Ultimate');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => win.show());
}

app.whenReady().then(createWindow);

function killAll() {
    exec('taskkill /IM goodbyedpi.exe /F /T');
    exec('taskkill /IM xray.exe /F /T');
    exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 0 /f');
}

// ФУНКЦИЯ СОЗДАНИЯ КОНФИГА (ДАННЫЕ ЗАМЕНЕНЫ НА ПУСТЫЕ)
function createXrayConfig() {
    const config = {
        "inbounds": [{ "port": 10808, "protocol": "socks", "settings": { "auth": "noauth", "udp": true } }],
        "outbounds": [{
            "protocol": "vless",
            "settings": {
                "vnext": [{
                    "address": "ВАШ_IP_АДРЕС", 
                    "port": 443,
                    "users": [{ "id": "ВАШ_UUID", "encryption": "none" }]
                }]
            },
            "streamSettings": { 
                "network": "tcp", 
                "security": "reality", 
                "realitySettings": { 
                    "serverName": "www.microsoft.com", 
                    "fingerprint": "chrome", 
                    "show": false, 
                    "publicKey": "ВАШ_ПУБЛИЧНЫЙ_КЛЮЧ", 
                    "shortId": "ВАШ_SHORT_ID", 
                    "spiderX": "ВАШ_SPIDER_X" 
                } 
            }
        }]
    };
    fs.writeFileSync(path.join(app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath(), 'config.json'), JSON.stringify(config, null, 4));
}

// ПРОВАЙДЕРЫ
function getGdpiArgs(provider) {
    const base = "--blacklist russia-blacklist.txt";
    switch (provider) {
        case 'domru': return `-9 --fake-gen 29 --fake-from-hex 1603030135010001310303424143facf5c983526afe2ce35cc287a94d016141957159d8c544d6e910c44170013c02b00120011c009c0130009000a002f00050004003501000119000000230000 ${base}`;
        case 'mts': return `-9 --fake-gen 5 --fake-resend 2 ${base}`;
        case 'rostelecom': return `-e 2 --fake-gen 5 --frag-by-sni ${base}`;
        case 'beeline': return `-e 2 --fake-gen 10 --wrong-seq ${base}`;
        case 'megafon': return `-9 --fake-gen 10 --wrong-seq ${base}`;
        default: return '-e 2 --reverse-frag';
    }
}

ipcMain.on('start-vpn', (event, mode) => {
    killAll();
    setTimeout(() => {
        const workDir = path.dirname(process.execPath);
        if (mode === 'vless') {
            createXrayConfig();
            exec(`start /B xray.exe run -c config.json`, { cwd: workDir });
            setTimeout(() => {
                exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f');
                exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "socks5://127.0.0.1:10808" /f');
            }, 1500);
        } else {
            exec(`start /B goodbyedpi.exe ${getGdpiArgs(mode)}`, { cwd: workDir });
        }
    }, 200);
});

ipcMain.on('stop-vpn', () => { killAll(); });
app.on('window-all-closed', () => { killAll(); app.quit(); });
