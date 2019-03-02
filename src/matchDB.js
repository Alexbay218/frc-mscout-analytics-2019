class matchDB {
  constructor(callback = () => {}) {
    var Datastore = require('nedb');
    var matchLoaderLite = require('./matchLoadLite.js');
    var matchLoader = require('./matchLoad.js');
    var matchTBA = require('./matchTBA.js');
    this.dbml = new Datastore({filename: require('electron').app.getAppPath() + "\\matchdb.db"});
    this.dbm = new Datastore();
    this.mtba = new matchTBA();
    this.mll = new matchLoaderLite();
    this.ml = new matchLoader();
    this.stats = {
      totalMatches: 0,
      tbaMatches: 0,
      availableTeams: []
    };
    this.ipcMain = require('electron').ipcMain;
    console.log("Loading DBML");
    this.dbml.loadDatabase(() => {
      console.log("Loading DBM");
      this.dbm.loadDatabase(() => {
        this.triggers();
        callback();
      });
    });
  }
  addMatchLite(str, cred, callback = () => {}) {
    this.dbml.find({raw: str}, (err, docs) => {
      if(docs.length <= 0 || (docs[0].credibility != undefined && docs[0].credibility != cred)) {
        var obj = this.mll.loadMatchLite(str);
        if(obj != null) {
          obj.credibility = cred;
          this.dbml.update({hash: obj.hash}, obj, {upsert: true}, () => {callback();});
        }
      }
      else {
        callback();
      }
    });
  }
  process(arg, callback = () => {}, event = null) {
    this.dbml.find(arg, (err, docs) => {
      var index = 0;
      var run = () => {
        if(index < docs.length) {
          console.log("Processing Matches " + (index+1) + "/" + docs.length);
          var res = this.ml.loadMatch(docs[index]);
          this.dbm.update({hash: res.hash}, res, {upsert: true}, () => {
            if(event != null) {
              event.sender.send("process-match-track", {position: index, total: docs.length});
            }
            index++;
            run();
          });
        }
        else {
          callback();
        }
      }
      run();
    });
  }
  processWithTBA(arg, callback = () => {}, event = null) {
    this.dbml.find(arg, (err, docs) => {
      var index = 0;
      var run = () => {
        if(index < docs.length) {
          console.log("Processing Matches " + (index+1) + "/" + docs.length);
          var obj = this.ml.loadMatch(docs[index]);
          this.mtba.connectTBA(obj, (success, res) => {
            docs[index].tbaData = res.tbaData;
            this.dbml.update({hash: res.hash}, docs[index], {upsert: true}, () => {
              this.dbm.update({hash: res.hash}, res, {upsert: true}, () => {
                if(event != null) {
                  event.sender.send("process-match-tba-track", {position: index, total: docs.length});
                }
                index++;
                run();
              });
            });
          });
        }
        else {
          callback();
        }
      }
      run();
    });
  }
  statLoad(callback) {
    console.log("Calculating Match Statistics");
    this.dbml.find({}, (err, docs) => {
      this.stats.totalMatches = docs.length;
      this.stats.tbaMatches = 0;
      this.stats.teamOnlyTBAMatches = 0;
      this.stats.availableTeams = [];
      this.stats.dateData = [];
      for(var i = 0;i < docs.length;i++) {
        //availableTeams
        if(docs[i].tbaData != undefined && docs[i].tbaData != null) {this.stats.tbaMatches++;}
        var found = false;
        for(var j = 0;j < this.stats.availableTeams.length;j++) {
          if(docs[i].targetTeam == this.stats.availableTeams[j].team) {
            this.stats.availableTeams[j].totalMatches++;
            found = true;
          }
        }
        if(!found) {
          this.stats.availableTeams.push({team: docs[i].targetTeam, totalMatches: 1});
        }
        //dateData
        this.stats.dateData.push({
          name: docs[i].targetTeam + "_" + docs[i].matchType + docs[i].matchNumber,
          date: docs[i].timeStamp-160000,
          value: 150
        });
      }
      callback();
    });
  }
  triggers() {
    this.ipcMain.on("update-lite", (event, args) => {
      console.log("Update Lite Event");
      this.dbml.update(args.filter, args.content, {upsert: true}, () => {
        this.process(args.filter, () => {
          event.sender.send("update-lite-reply", {});
          event.returnValue = {};
        });
      });
    });
    this.ipcMain.on("remove", (event, arg) => {
      console.log("Remove Data Event");
      this.dbml.find(arg, (err, docs) => {
        this.dbml.remove(arg, {multi: true}, (err, numRemoved) => {
          for(var i = 0;i < docs.length;i++) {
            this.dbm.remove({raw: docs[i].raw}, {multi: true}, () => {});
          }
          event.returnValue = {};
          console.log("Remove Data Event returned to client");
        });
      });
    });
    this.ipcMain.on("remove-team", (event, arg) => {
      console.log("Remove Team Data Event");
      this.mtba.tbaDBTeam.remove(arg, {multi: true}, (err, numRemoved) => {
        this.mtba.tbaDBLm.remove({}, {multi: true}, () => {});
        event.returnValue = {};
        console.log("Remove Team Data Event returned to client");
      });
    });
    this.ipcMain.on("query", (event, arg) => {
      console.log("Query Processed Data Event");
      this.process(arg, () => {
        this.dbm.find(arg, (err, docs) => {
          event.sender.send("query-reply", docs);
          event.returnValue = docs;
          console.log("Query Processed Data Event returned to client");
        });
      });
    });
    this.ipcMain.on("query-lite", (event, arg) => {
      console.log("Query Lite Data Event");
      this.dbml.find(arg, (err, docs) => {
        event.sender.send("query-lite-reply", docs);
        event.returnValue = docs;
        console.log("Query Lite Data Event returned to client");
      });
    });
    this.ipcMain.on("query-team", (event, arg) => {
      console.log("Query Team Data Event");
      this.mtba.tbaDBTeam.find(arg, (err, docs) => {
        event.sender.send("query-team-reply", docs);
        event.returnValue = docs;
        console.log("Query Team Data Event returned to client");
      });
    });
    this.ipcMain.on("query-team-sync", (event, arg) => {
      console.log("Query Team Sync Event");
      if(!arg) {
        event.sender.send("query-team-sync-reply", this.mtba.synced);
        console.log("Query Team Sync Event returned to client");
      }
      else {
        this.mtba.syncTeam(() => {
          event.sender.send("query-team-sync-reply", this.mtba.synced);
          console.log("Query Team Sync Event returned to client");
        }, event);
      }
    });
    this.ipcMain.on("query-stats", (event, arg) => {
      console.log("Query Stat Data Event");
      this.statLoad(() => {
        event.sender.send("query-stats-reply", this.stats);
        event.returnValue = this.stats;
        console.log("Query Stat Data Event returned to client");
      });
    });
    this.ipcMain.on("process-match", (event, arg) => {
      console.log("Process Match Event");
      this.process(arg, () => {
        event.sender.send("process-match-reply", {});
        event.returnValue = {};
      }, event);
    });
    this.ipcMain.on("process-match-tba", (event, arg) => {
      console.log("Process Match TBA Event");
      this.processWithTBA(arg, () => {
        event.sender.send("process-match-tba-reply", {});
        event.returnValue = {};
      }, event);
    });
  }
}

module.exports = matchDB;
