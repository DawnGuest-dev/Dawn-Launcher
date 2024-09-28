import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';
import {Jimp} from "jimp";

// electron-reload가 개발 중에만 동작하도록 설정
if (!app.isPackaged) {
    require('electron-reload')(path.join(__dirname, '..'), {
        electron: path.join(__dirname, '..', 'node_modules', 'electron'),
        hardResetMethod: 'exit',
    });
}

let mainWindow: BrowserWindow | null;

function createWindow() {
    console.log(__dirname);
    mainWindow = new BrowserWindow({
        minWidth: 1080,
        minHeight: 720,
        width: 1080,
        height: 720,
        frame: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false, // Node integration 비활성화
            contextIsolation: true, // context isolation 활성화
            devTools: true,
            preload: path.join(__dirname, 'preload.js'), // preload script 설정
        },
    });

    // // 메뉴 바 완전히 제거
    mainWindow.setMenu(null);
    mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools({mode: "detach"}); // 개발 환경에서만 개발자 도구 열기
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

// IPC 이벤트 처리
ipcMain.on('minimize-window', () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});

ipcMain.on('maximize-window', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.restore();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('close-window', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

ipcMain.on('open-link', (event, url) => {
    shell.openExternal(url); // 기본 웹 브라우저에서 URL 열기
});

app.on('ready', createWindow);
