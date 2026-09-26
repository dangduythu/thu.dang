const {app, BrowserWindow, dialog, ipcMain, net, protocol} = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {assetPath} = require('./paths.cjs');

const SCHEME = 'mathkid';
const ORIGIN = SCHEME + '://app';
const MAX_BACKUP_BYTES = 20_000_000;
protocol.registerSchemesAsPrivileged([
  {scheme:SCHEME, privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}
]);
app.setName('MathKid 4 Pro');

function validateBackup(text) {
  if(typeof text !== 'string' || Buffer.byteLength(text,'utf8') > MAX_BACKUP_BYTES)
    throw new Error('Bản sao lưu không hợp lệ hoặc quá lớn.');
  const data = JSON.parse(text);
  if (!data || data.format !== 'mathkid4-backup' || ![1,2].includes(data.version)
      || !Array.isArray(data.progress?.history) || !Array.isArray(data.progress?.seen))
    throw new Error('Tệp không phải bản sao lưu MathKid V1/V2.');
  return text;
}
function isAllowedNavigation(url) {
  try {const u=new URL(url);return u.protocol===SCHEME+':'&&u.hostname==='app';}
  catch {return false;}
}
async function createWindow() {
  const root=path.resolve(__dirname,'..','dist');
  await fs.access(path.join(root,'index.html'));
  const win=new BrowserWindow({
    width:1160,height:820,minWidth:640,minHeight:560,
    title:'MathKid 4 Pro',backgroundColor:'#f7faf8',show:false,
    webPreferences:{
      preload:path.join(__dirname,'preload.cjs'),
      contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true
    }
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',(event,url)=>{
    if (!isAllowedNavigation(url)) event.preventDefault();
  });
  win.once('ready-to-show',()=>win.show());
  await win.loadURL(ORIGIN+'/index.html');
}

app.whenReady().then(async()=>{
  protocol.handle(SCHEME,async request=>{
    let location;
    try {location=assetPath(path.resolve(__dirname,'..','dist'),request.url);}
    catch {return new Response('Invalid request',{status:400});}
    try {
      await fs.access(location);
      return net.fetch(pathToFileURL(location).toString());
    } catch {
      return new Response('Not found',{status:404});
    }
  });
  ipcMain.handle('mathkid:save-backup',async (event,text)=>{
    if(!isAllowedNavigation(event.sender.getURL()))throw new Error('Unauthorized');
    validateBackup(text);
    const result=await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender),{
      title:'Lưu dữ liệu học MathKid',defaultPath:'MathKid4-backup.json',
      filters:[{name:'MathKid JSON',extensions:['json']}]
    });
    if(result.canceled || !result.filePath)return {cancelled:true};
    await fs.writeFile(result.filePath,text,{encoding:'utf8',flag:'w'});
    return {cancelled:false};
  });
  ipcMain.handle('mathkid:open-backup',async event=>{
    if(!isAllowedNavigation(event.sender.getURL()))throw new Error('Unauthorized');
    const result=await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender),{
      title:'Chọn bản sao lưu MathKid',properties:['openFile'],
      filters:[{name:'MathKid JSON',extensions:['json']}]
    });
    if(result.canceled || !result.filePaths[0])return {cancelled:true};
    const info=await fs.stat(result.filePaths[0]);
    if(info.size>MAX_BACKUP_BYTES)throw new Error('Tệp sao lưu quá lớn.');
    return {cancelled:false,text:validateBackup(await fs.readFile(result.filePaths[0],'utf8'))};
  });
  await createWindow();
}).catch(err=>{
  dialog.showErrorBox('MathKid không thể khởi động',String(err?.message||err));
  app.quit();
});

app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow().catch(()=>app.quit());});
