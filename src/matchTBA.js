class matchTBA {
  constructor() {
    var Datastore = require('nedb');
    this.synced = false;
    this.apiKey = "M7LzOvSZEzksZGkYcMjoFfKT8lpl6dDeHPUsvdkmXdQrNpbjaqto8cG1rSfirXLX";
    this.year = "2019";
    this.XMLHttpRequest = require("xhr2");
    this.tbaDBLm = new Datastore({filename: require('electron').app.getAppPath() + "\\tbadb_lm"});
    this.tbaDBTeam = new Datastore({filename: require('electron').app.getAppPath() + "\\tbadb_team"});
    this.tbaDBLm.loadDatabase(() => {
      this.tbaDBTeam.loadDatabase(() => {
        this.syncTeam(() => {});        
      });
    });
  }
  connectTBA(matchObjIn, callback) {
    var matchObj = Object.assign({}, matchObjIn);
    if(matchObj.matchType == "T" || matchObj.matchType == "PF" || matchObj.matchType == "PM") {
      callback(false, matchObj);
    }
    else {
      var res = {};
      var xhttp = new this.XMLHttpRequest();
      xhttp.onreadystatechange = () => {
        if(xhttp.readyState == 4 && (xhttp.status == 200 || xhttp.status == 304)) {
          var obj = xhttp.status == 304 ? [matchObj.eventData] : JSON.parse(xhttp.responseText);
          var tar = null;
          for(var i = 0;i < obj.length;i++) {
            var startDate = new Date(obj[i].start_date);
            var tarDate = new Date(matchObj.timeStamp);
            var endDate = new Date(obj[i].end_date);
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
                var equal = require('deep-equal');
                res.eventData = Object.assign({}, tar);
                res.matchData = Object.assign({}, obj2);
                res.lastModified = {event: xhttp.getResponseHeader("Last-Modified"), match: xhttp2.getResponseHeader("Last-Modified")};
                if(matchObj.tbaData != undefined) {
                  if(!equal(matchObj.tbaData, res)) {
                    matchObj.tbaData = Object.assign({}, res);
                  }
                }
                else {
                  matchObj.tbaData = Object.assign({}, res);
                }
                callback(true, matchObj);
              }
              else if(xhttp2.readyState == 4 && xhttp2.status == 304) {
                callback(true, matchObj);
              }
            };
            xhttp2.open("GET", "https://www.thebluealliance.com/api/v3/matches/" + this.year + tar.key + "_" + compLvl + matchObj.matchNumber, true);
            xhttp2.setRequestHeader("X-TBA-Auth-Key", this.apiKey);
            if(matchObj.tbaData.lastModified.match != undefined) {
              xhttp2.setRequestHeader("If-Modified-Since", matchObj.tbaData.lastModified.match);
            }
            xhttp2.send();
          }
        }
        else if(xhttp.readyState == 4) {
          callback(false, matchObj);
        }
      };
      xhttp.open("GET", "https://www.thebluealliance.com/api/v3/team/frc" + matchObj.targetTeam.toString() + "/events/" + this.year, true);
      xhttp.setRequestHeader("X-TBA-Auth-Key", this.apiKey);
      if(matchObj.tbaData.lastModified.event != undefined) {
        xhttp.setRequestHeader("If-Modified-Since", matchObj.tbaData.lastModified.event);
      }
      xhttp.send();
    }
  }
  syncTeam(callback) {
    var index = 0;
    var xhttp = new this.XMLHttpRequest();
    this.tbaDBLm.find({type: "team"}, (err, docs) => {
      var lmObj = docs[0];
      var run = () => {
        xhttp = new this.XMLHttpRequest();
        xhttp.onreadystatechange = () => {
          if(xhttp.readyState == 4) {
            var res = [];
            if(xhttp.status == 200) {
              res = JSON.parse(xhttp.responseText);
              console.log(res);
              var needed = res.length;
              var curr = 0;
              for(var i = 0;i < res.length;i++) {
                var obj = res[i];
                this.tbaDBTeam.update({key: obj.key}, obj, {upsert: true}, () => {
                  curr++;
                  if(curr >= needed - 1) {
                    lmObj["lm" + index] = xhttp.getResponseHeader("Last-Modified");
                    index++;
                    xhttp.abort();
                    run();
                  }
                });
              }
            }
            if(xhttp.status == 304) {
              index++;
              xhttp.abort();
              run();
            }
            else {
              this.tbaDBLm.update({type: "team"}, lmObj, {}, () => {
                this.synced = true;
                callback();
              });
            }
          }
        };
        xhttp.open("GET", "https://www.thebluealliance.com/api/v3/teams/" + index + "/simple", true);
        xhttp.setRequestHeader("X-TBA-Auth-Key", this.apiKey);
        if(lmObj["lm" + index] != undefined) {
          xhttp.setRequestHeader("If-Modified-Since", lmObj["lm" + index]);
        }
        xhttp.send();
      }
      if(docs.length <= 0) {
        lmObj = {type: "team"};
        this.tbaDBLm.insert(lmObj, {}, () => {
          run();
        });
      }
      else {
        run();
      }
    });
  }
}

module.exports = matchTBA;
