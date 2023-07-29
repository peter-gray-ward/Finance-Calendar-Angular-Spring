const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  sync: (event) => ipcRenderer.invoke('sync', event),
  api: (which, data) => {
    debugger
    console.log(which, data)
    return ipcRenderer.invoke('api', which, data);
  },
  render: (which, data) => ipcRenderer.invoke('render', which, data)
});