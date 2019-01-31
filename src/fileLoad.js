class fileLoader{
    constructor() {
      this.readdir = require("recursive-readdir");
      this.fs = require("fs");
      const { ipcMain } = require('electron');
      this.ipcMain = ipcMain;
    }
    load(path, callback) {
      var res = [];
      this.readdir(path, (err, files) => {
        for(var i = 0;i < files.length;i++) {
          if(files[i].indexOf(".fmt") != -1) {
            res.push(this.fs.readFileSync(path+files[i], "utf8"));
          }
        }
        callback(res);
      });
    }
}

module.exports = fileLoader;
