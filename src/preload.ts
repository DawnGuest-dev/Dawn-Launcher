import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel: string, data: any) => {
            ipcRenderer.send(channel, data);
        },
        on: (channel: string, listener: (event: any, data: any) => void) => {
            ipcRenderer.on(channel, listener);
        },
    },
});
