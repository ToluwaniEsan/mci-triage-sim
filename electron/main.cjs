const { app, BrowserWindow } = require('electron')
const path = require('node:path')

// Always loads the built app (run `npm run build` first). Kept simple rather
// than juggling a dev-server URL — this shell wraps the finished game, it
// isn't meant to be the primary dev loop (use `npm run dev` in a browser for that).
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 700,
    backgroundColor: '#0d1117',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
