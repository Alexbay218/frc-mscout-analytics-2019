class matchTBA {
  constructor() {
    var Datastore = require('nedb');
    this.synced = "not syncing";
    this.apiKey = "M7LzOvSZEzksZGkYcMjoFfKT8lpl6dDeHPUsvdkmXdQrNpbjaqto8cG1rSfirXLX";
    this.year = "2019";
    this.XMLHttpRequest = require("xhr2");
    this.tbaDBLm = new Datastore({filename: require('electron').app.getAppPath() + "\\tbadb_lm.db", autoload: true});
    this.tbaDBTeam = new Datastore({filename: require('electron').app.getAppPath() + "\\tbadb_team.db", autoload: true});
  }
  connectTBA(matchObjIn, callback) {
    var res = {};
    var xhttp = new this.XMLHttpRequest();
    var matchObj = Object.assign({}, matchObjIn);
    if(matchObj.tbaData == undefined) {
      matchObj.tbaData = null;
    }
    if(matchObj.matchType == "T" || matchObj.matchType == "PF" || matchObj.matchType == "PM") {
      callback(false, matchObj);
    }
    else {
      xhttp.onreadystatechange = () => {
        if(xhttp.readyState == 4 && (xhttp.status == 200 || xhttp.status == 304)) {
          var obj = xhttp.status == 304 ? [matchObj.tbaData.eventData] : JSON.parse(xhttp.responseText);
          var tar = null;
          for(var i = 0;i < obj.length;i++) {
            var startDate = new Date(obj[i].start_date);
            startDate.setDate(startDate.getDate() - 2);
            var tarDate = new Date(matchObj.timeStamp);
            var endDate = new Date(obj[i].end_date);
            endDate.setDate(endDate.getDate() + 2);
            if(startDate <= tarDate && tarDate <= endDate) {
              tar = obj[i];
            }
          }
          if(tar != null) {
            var compLvl = "";
            if(matchObj.matchType == "Q") {compLvl = "qm";}
            if(matchObj.matchType == "QF") {compLvl = "qf";}
            if(matchObj.matchType == "SF") {compLvl = "sf";}
            if(matchObj.matchType == "F") {compLvl = "f";}
            var xhttp2 = new this.XMLHttpRequest();
            xhttp2.onreadystatechange = () => {
              if(xhttp2.readyState == 4 && xhttp2.status == 200) {
                var obj2 = JSON.parse(xhttp2.responseText);
                var contained = null;
                for(var i = 0;i < obj2.length;i++) {
                  if(obj2[i].comp_level == compLvl) {
                    if(obj2[i].match_number == matchObj.matchNumber) {
                      for(var j = 0;j < obj2[i].alliances.blue.team_keys.length;j++) {
                        if(obj2[i].alliances.blue.team_keys[j] == "frc" + matchObj.targetTeam) {
                          contained = obj2[i];
                        }
                      }
                      for(var j = 0;j < obj2[i].alliances.blue.surrogate_team_keys.length;j++) {
                        if(obj2[i].alliances.blue.surrogate_team_keys[j] == "frc" + matchObj.targetTeam) {
                          contained = obj2[i];
                        }
                      }
                      for(var j = 0;j < obj2[i].alliances.red.team_keys.length;j++) {
                        if(obj2[i].alliances.red.team_keys[j] == "frc" + matchObj.targetTeam) {
                          contained = obj2[i];
                        }
                      }
                      for(var j = 0;j < obj2[i].alliances.red.surrogate_team_keys.length;j++) {
                        if(obj2[i].alliances.red.surrogate_team_keys[j] == "frc" + matchObj.targetTeam) {
                          contained = obj2[i];
                        }
                      }
                    }
                  }
                }
                var equal = require('deep-equal');
                if(contained != null) {
                  res.eventData = Object.assign({}, tar);
                  res.matchData = Object.assign({}, contained);
                  res.lastModified = {event: xhttp.getResponseHeader("Last-Modified"), match: xhttp2.getResponseHeader("Last-Modified")};
                  if(matchObj.tbaData != undefined) {
                    if(!equal(matchObj.tbaData, contained)) {
                      matchObj.tbaData = Object.assign({}, res);
                    }
                  }
                  else {
                    matchObj.tbaData = Object.assign({}, res);
                  }
                }
                callback(true, matchObj);
              }
              else if(xhttp2.readyState == 4 && xhttp2.status == 304) {
                callback(true, matchObj);
              }
              else if(xhttp2.readyState == 4) {
                callback(false, matchObj);
              }
            };
            xhttp2.open("GET", "https://www.thebluealliance.com/api/v3/event/" + tar.key + "/matches", true);
            xhttp2.setRequestHeader("X-TBA-Auth-Key", this.apiKey);
            if(matchObj.tbaData != undefined && matchObj.tbaData.lastModified.match != undefined) {
              xhttp2.setRequestHeader("If-Modified-Since", matchObj.tbaData.lastModified.match);
            }
            xhttp2.send();
          }
          else {
            callback(false, matchObj);
          }
        }
        else if(xhttp.readyState == 4) {
          callback(false, matchObj);
        }
      };
      xhttp.open("GET", "https://www.thebluealliance.com/api/v3/team/frc" + matchObj.targetTeam.toString() + "/events/" + this.year, true);
      xhttp.setRequestHeader("X-TBA-Auth-Key", this.apiKey);
      if(matchObj.tbaData != undefined && matchObj.tbaData.lastModified.event != undefined) {
        xhttp.setRequestHeader("If-Modified-Since", matchObj.tbaData.lastModified.event);
      }
      xhttp.send();
    }
  }
  syncTeam(callback, eventEmitter = null) {
    var index = 0;
    var xhttp = new this.XMLHttpRequest();
    this.synced = "syncing";
    this.tbaDBLm.find({type: "team"}, (err, docs) => {
      console.log("Syncing TBADBTeam");
      var lmObj = {};
      var run = () => {
        console.log("\n\n");
        console.log("Current Index is " + index);
        console.log("Last Modified Object");
        console.log(lmObj);
        xhttp = new this.XMLHttpRequest();
        xhttp.onreadystatechange = () => {
          console.log("XHTTP state changed, ready state: " + xhttp.readyState);
          console.log("XHTTP status: " + xhttp.status);
          if(xhttp.readyState == 4) {
            var done = false;
            var res = [];
            if(xhttp.status == 200) {
              console.log("Getting Team Data Page " + index);
              res = JSON.parse(xhttp.responseText);
              var deleteArg = [];
              if(res.length > 0) {
                for(var i = 0;i < res.length;i++) {
                  deleteArg.push(res[i].team_number);
                }
                if(eventEmitter != null) {eventEmitter.sender.send("query-team-sync-track",{position: res.length, total: res.length, page: index})}
                this.tbaDBTeam.remove({team_number: { $in: deleteArg}}, {multi: true}, () => {
                  this.tbaDBTeam.insert(res, () =>{
                    lmObj["lm" + index] = xhttp.getResponseHeader("Last-Modified");
                    index++;
                    xhttp.abort();
                    run();
                  });
                });
              }
              else {
                done = true;
              }
            }
            else if(xhttp.status == 304) {
              if(eventEmitter != null) {eventEmitter.sender.send("query-team-sync-track",{position: -1, total: 0, page: index})}
              console.log("Skipping Team Data Page " + index);
              index++;
              xhttp.abort();
              run();
            }
            else {
              console.log("Something went wrong, http status: " + xhttp.status);
              done = true;
            }
            if(done) {
              console.log("Updating TBADBLM Data");
              this.tbaDBLm.update({type: "team"}, lmObj, {}, () => {
                console.log("TBADBTeam Data Synced");
                this.synced = "synced";
                callback();
              });
            }
          }
        };
        xhttp.open("GET", "https://www.thebluealliance.com/api/v3/teams/" + index, true);
        xhttp.setRequestHeader("X-TBA-Auth-Key", this.apiKey);
        if(lmObj["lm" + index] != undefined) {
          xhttp.setRequestHeader("If-Modified-Since", lmObj["lm" + index]);
        }
        console.log("HTTP Request Sent");
        xhttp.send();
      };
      if(docs.length <= 0) {
        lmObj = {type: "team"};
        this.tbaDBLm.insert(lmObj, () => {
          run();
        });
      }
      else {
        lmObj = docs[0];
        run();
      }
    });
  }
}

module.exports = matchTBA;
