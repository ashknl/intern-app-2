import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { getDb, getUserByUsername, getUserSecurityQuestion } from './db/index.js'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bcryptjs = require('bcryptjs')
const xlsx = require('node-xlsx')

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

// --- Excel IPC handlers ---

ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: [
      { name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return { filePath: result.filePaths[0] }
})

ipcMain.handle('dialog:confirm', async (_event, args: { title: string; message: string }) => {
  const result = await dialog.showMessageBox(win!, {
    type: 'question',
    title: args.title,
    message: args.message,
    buttons: ['Cancel', 'OK'],
    defaultId: 1,
    cancelId: 0,
  })

  return result.response === 1
})

ipcMain.handle('excel:read', async (_event, args: { filePath: string }) => {
  try {
    const sheets = xlsx.parse(args.filePath)
    const firstSheet = sheets[0]
    const data = firstSheet.data as (string | number | null)[][]

    if (data.length < 2) {
      return { success: false, error: 'File has no data rows' }
    }

    const headers = data[0].map((h) => String(h ?? ''))
    const rows: Record<string, string>[] = []

    for (let i = 1; i < data.length; i++) {
      const row: Record<string, string> = {}
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = String(data[i]?.[j] ?? '')
      }
      rows.push(row)
    }

    return { success: true, headers, rows }
  } catch (err) {
    return { success: false, error: String(err), headers: [], rows: [] }
  }
})

ipcMain.handle('excel:write', async (_event, args: {
  filePath: string
  headers: string[]
  rows: Record<string, string>[]
}) => {
  try {
    const data: string[][] = [args.headers]

    for (const row of args.rows) {
      const rowData = args.headers.map((h) => row[h] ?? '')
      data.push(rowData)
    }

    const buffer = xlsx.build([{ name: 'Sheet1', data }])
    fs.writeFileSync(args.filePath, buffer)

    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})
