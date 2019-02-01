class matchDB {
  constructor() {
    var Datastore = require('nedb');
    this.dbml = new Datastore({filename: require('electron').app.getAppPath() + "\\matchdb"});
    this.dbm = new Datastore();
    this.mll = require('./matchLoadLite.js');
    this.ml = require('./matchLoad.js');
    var matchTBA = require('./matchTBA.js');
    this.mtba = new matchTBA();
    const { ipcMain } = require('electron');
    this.ipcMain = ipcMain;
    this.dbml.loadDatabase(() => {
      this.dbm.loadDatabase(() => {
        this.process();
        this.triggers();
      });
    });
  }
  addMatchLite(str) {
    this.dbml.find({raw: str}, (err, docs) => {
      if(docs.length <= 0) {
        var obj = this.mll.loadMatchLite(str);
        if(obj != null) {
          this.dbml.insert(obj);
        }
      }
    });
  }
  process() {
    this.dbml.find({}, (err, docs) => {
      for(var i = 0;i < docs.length;i++) {
        var obj = ml.loadMatch(docs[i]);
        this.mtba.connectTBA(obj, (success, res) => {
          this.dbm.update({team_number: res.team_number}, res, {upsert: true});
        });
      }
    });
  }
  triggers() {
    this.ipcMain.on("remove", (event, arg) => {
      this.dbml.find(arg, (err, docs) => {
        this.dbml.remove(arg, {multi: true}, (err, numRemoved) => {
          for(var i = 0;i < docs.length;i++) {
            this.dbm.remove({raw: docs[i].raw}, {multi: true}, () => {});
          }
        });
      });
    });
    this.ipcMain.on("query", (event, arg) => {
      this.dbm.find(arg, (err, docs) => {
        event.sender.send("query-reply", docs);
      });
    });
    this.ipcMain.on("query-lite", (event, arg) => {
      this.dbml.find(arg, (err, docs) => {
        event.sender.send("query-lite-reply", docs);
      });
    });
    this.ipcMain.on("query-team", (event, arg) => {
      this.mtba.tbaDBTeam.find(arg, (err, docs) => {
        event.sender.send("query-team-reply", docs);
      });
    });
  }
}

module.exports = matchDB;
