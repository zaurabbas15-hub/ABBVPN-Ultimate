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

// ТВОИ ДАННЫЕ
const KEYS_URL = "https://gist.githubusercontent.com/zaurabbas15-hub/4c04c7980c3537479d754e52dcaab245/raw/gistfile1.txt";
const vlessLink = "vless://9c9c27db-c405-4a18-938b-78ef5c6e6aa6@109.120.177.8:443?encryption=none&fp=chrome&pbk=7HKzYgCuVtDgZqe8C1a1Elrd4u3-GIhz92DFT9RzgCo&security=reality&sid=c5dd15&sni=www.microsoft.com&spx=%2FuD2s5qdYCoM1sRp&type=tcp#ABBVPN-1gf5b6ek";

const licenseFilePath = path.join(app.getPath('userData'), 'license.txt');

ipcMain.on('get-hwid', (event) => { event.reply('hwid-data', hwid); });

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

function createXrayConfig() {
    const config = {
        "inbounds": [{ "port": 10808, "protocol": "socks", "settings": { "auth": "noauth", "udp": true } }],
        "outbounds": [{
            "protocol": "vless",
            "settings": {
                "vnext": [{
                    "address": "109.120.177.8", "port": 443,
                    "users": [{ "id": "9c9c27db-c405-4a18-938b-78ef5c6e6aa6", "encryption": "none" }]
                }]
            },
            "streamSettings": { "network": "tcp", "security": "reality", "realitySettings": { "serverName": "www.microsoft.com", "fingerprint": "chrome", "show": false, "publicKey": "7HKzYgCuVtDgZqe8C1a1Elrd4u3-GIhz92DFT9RzgCo", "shortId": "c5dd15", "spiderX": "/uD2s5qdYCoM1sRp" } }
        }]
    };
    fs.writeFileSync(path.join(app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath(), 'config.json'), JSON.stringify(config, null, 4));
}

// ПРОВАЙДЕРЫ (Настройки)
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
            // ФОНОВЫЙ ЗАПУСК XRAY
            exec(`start /B xray.exe run -c config.json`, { cwd: workDir });
            setTimeout(() => {
                exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyEnable /t REG_DWORD /d 1 /f');
                exec('reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer /t REG_SZ /d "socks5://127.0.0.1:10808" /f');
            }, 1500);
        } else {
            // ФОНОВЫЙ ЗАПУСК GOODBYEDPI (Никаких окон!)
            exec(`start /B goodbyedpi.exe ${getGdpiArgs(mode)}`, { cwd: workDir });
        }
    }, 200);
});

ipcMain.on('stop-vpn', () => { killAll(); });
app.on('window-all-closed', () => { killAll(); app.quit(); });