import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { getDb, getUserByUsername, getUserSecurityQuestion } from './db/index.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bcryptjs = require('bcryptjs')

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  getDb()
  createWindow()
})

// --- Auth IPC handlers ---

ipcMain.handle('auth:login', async (_event, args: { username: string; password: string }) => {
  try {
    const user = getUserByUsername(args.username)
    if (!user) {
      return { success: false, error: 'Invalid username or password.' }
    }
    const match = bcryptjs.compareSync(args.password, user.password_hash)
    if (!match) {
      return { success: false, error: 'Invalid username or password.' }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('auth:getSecurityQuestion', async (_event, args: { username: string }) => {
  try {
    const question = getUserSecurityQuestion(args.username)
    if (!question) {
      return { success: false, error: 'User not found.' }
    }
    return { success: true, question }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

ipcMain.handle('auth:verifySecurityAnswer', async (_event, args: { username: string; answer: string }) => {
  try {
    const user = getUserByUsername(args.username)
    if (!user) {
      return { success: false, error: 'User not found.' }
    }
    const match = bcryptjs.compareSync(args.answer, user.security_answer_hash)
    if (!match) {
      return { success: false, error: 'Incorrect answer.' }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})
