import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel: string, data?: any) => {
            // 허용된 채널을 확인
            const validChannels = ['minimize-window', 'close-window', 'maximize-window', 'open-link', 'run-unity'];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
    }
});
