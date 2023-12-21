const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  sync: (event)         => ipcRenderer.invoke('sync', event),
  api: (which, data)    => ipcRenderer.invoke('api', which, data),
  render: (which, data) => ipcRenderer.invoke('render', which, data)//,
  // stream: (which, data) => ipcRenderer.invoke('stream', which, data)
});