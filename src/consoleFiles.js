class consoleFiles {
  constructor() {
    var Datastore = require('nedb');
    this.dbcf = new Datastore({filename: require('electron').app.getAppPath() + "\\consolefiles.db"});
    this.ipcMain = require('electron').ipcMain;
    console.log("Loading Console Mode Files");
    this.dbcf.loadDatabase(() => {
      this.triggers();
    });
  }
  triggers() {
    this.ipcMain.on("query-console-file", (event, arg) => {
      console.log("Query Console File Event");
      this.dbcf.find(arg, (err, docs) => {
        event.sender.send("query-console-file-reply", docs);
        event.returnValue = docs;
        console.log("Query Console File returned to client");
      });
    });
    this.ipcMain.on("remove-console-file", (event, arg) => {
      console.log("Remove Console File Event");
      this.dbcf.remove(arg, {multi: true}, (err, numRemoved) => {
        event.returnValue = {};
        console.log("Remove Console File Event returned to client");
      });
    });
    this.ipcMain.on("update-console-file", (event, args) => {
      console.log("Update Console File Event");
      this.dbcf.update({filename: args.filename}, args, {upsert: true}, () => {
        event.returnValue = {};
        console.log("Update Console File Event returned to client");
      });
    });
  }
}

module.exports = consoleFiles;
