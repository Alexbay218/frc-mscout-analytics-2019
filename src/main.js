const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const fileLoader = require('./fileLoad.js');
const matchDB = require('./matchDB.js');
var mdb = new matchDB();
var fl = new fileLoader();

app.on('ready', () => {
  win = new BrowserWindow({ width: 1200, height: 800 });;
  var menu = Menu.buildFromTemplate([{
    label: 'Dev',
    submenu: [{label: 'Launch Dev Tools', role: 'toggleDevTools'}]
  }]);
  Menu.setApplicationMenu(menu);
  win.loadFile('render/dashboard.html');
  ipcMain.on("open-file", () => {
    dialog.showOpenDialog(win, {properties: "openDirectory"}, (filePaths) => {
      fl.load(filePaths[0], (contents) => {
        for(var i = 0;i < contents.length;i++) {
          mdb.addMatchLite(contents[i]);
        }
      });
    });
  });
});
