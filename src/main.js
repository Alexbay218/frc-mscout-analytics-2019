const { app, BrowserWindow, dialog, Menu, ipcMain } = require('electron');
const fileLoader = require('./fileLoad.js');
const matchDB = require('./matchDB.js');
const consoleFiles = require('./consoleFiles.js');
var metadata = {};
var mdb = {};
var fl = {};
var cf = {};

app.on('ready', () => {
  console.log("Creating Browser Window");
  win = new BrowserWindow({ width: 1300, height: 850, icon: __dirname + "/../assets/first.ico" });;

  var menu = Menu.buildFromTemplate([{
    label: 'Dev',
    submenu: [{label: 'Launch Dev Tools', role: 'toggleDevTools'}]
  }]);
  Menu.setApplicationMenu(menu);

  ipcMain.on("open-file", (event, arg) => {
    dialog.showOpenDialog(win, {properties: ["openDirectory"]}, (filePaths) => {
      if(filePaths != undefined) {
        fl.load(filePaths[0], (contents) => {
          var index = 0;
          var run = () => {
            if(index < contents.length) {
              mdb.addMatchLite(contents[index], arg, () => {
                console.log("Adding Content: " + (index+1) + "/" + contents.length);
                event.sender.send("open-file-track", {position: index, total: contents.length});
                index++;
                run();
              });
            }
            else {
              event.sender.send("open-file-reply", null);
              event.returnValue = null;
            }
          }
          run();
        });
      }
      else {
        event.sender.send("open-file-reply", null);
        event.returnValue = null;
      }
    });
  });

  ipcMain.on("open-url", (event, arg) => {
    console.log("Loading Webpage: " + arg);
    win.loadFile(arg);
    event.returnValue = null;
  });

  ipcMain.on("get-metadata", (event, arg) => {
    event.sender.send("get-metadata-reply", metadata);
    event.returnValue = metadata;
  });

  ipcMain.on("set-metadata", (event, arg) => {
    metadata = arg;
    event.sender.send("set-metadata-reply", metadata);
    event.returnValue = metadata;
  });

  mdb = new matchDB(() => {
    console.log("Loading Webpage: render/splash.html");
    win.loadFile('render/splash.html');    
  });

  fl = new fileLoader();

  cf = new consoleFiles();

});
