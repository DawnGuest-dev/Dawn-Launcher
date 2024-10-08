﻿import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import path from 'node:path';
import { spawn } from 'child_process';
import './login';
import {getAccessToken, getRefreshToken} from "./login";

// electron-reload가 개발 중에만 동작하도록 설정
if (!app.isPackaged) {
    require('electron-reload')(path.join(__dirname, '..'), {
        electron: path.join(__dirname, '..', 'node_modules', 'electron'),
        hardResetMethod: 'exit',
    });
}

let mainWindow: BrowserWindow | null;

function runUnityBuild(gamePath: string, args: string[]) {
    const command = gamePath; // Unity 빌드 파일 경로
    const childProcess = spawn(command, args, { detached: true, stdio: 'ignore' });

    childProcess.unref(); // 부모 프로세스가 자식 프로세스를 기다리지 않도록 함
    console.log(`Started ${command} with args: ${args.join(' ')}`);
}


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
    // mainWindow.loadFile(path.join(__dirname, '..', 'public', 'index.html'));
    mainWindow.loadFile(path.join(__dirname, '..', 'public', 'login.html'));

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

ipcMain.on('run-unity', (event, data) => {
    const gamePath = data.gamePath; // 게임 경로
    const args = [...data.args]; // 인수

    const accessToken = getAccessToken(); // 로그인 토큰 가져오기
    const refreshToken = getRefreshToken(); // 리프레시 토큰 가져오기

    // 토큰이 존재할 경우 인수에 추가
    if (accessToken) {
        args.push(`--accessToken=${accessToken}`);
    }
    if (refreshToken) {
        args.push(`--refreshToken=${refreshToken}`);
    }

    runUnityBuild(gamePath, args); // Unity 빌드 실행
});

ipcMain.on('show-dialog', (event, { title, message, detail }) => {
    if (mainWindow) {
        dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: title,
            message: message,
            detail: detail,
        }).catch(err => {
            console.error('다이얼로그 표시 중 오류 발생:', err);
        });
    }
});

app.on('ready', createWindow);
