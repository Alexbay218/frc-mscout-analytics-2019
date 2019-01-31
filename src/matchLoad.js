class matchLoader {
  constructor() {
    this.md5 = require("md5");
  }
  loadMatch(mlObj) {
    this.data = [];
    for(var i = 0;i < mlObj.matchData.length;i++) {
      this.data.push({key: mlObj.matchData[i].key, value: Number.parseFloat(mlObj.matchData[i].value)});
    }
    var res = {
      raw: mlObj.raw,
      hash: this.md5(mlObj.raw),
      sourceTeam: mlObj.sourceTeam,
      targetTeam: mlObj.targetTeam,
      timeStamp: mlObj.timeStamp,
      matchType: mlObj.matchType,
      matchNumber: mlObj.matchNumber,
      initData: {
        cargoCount: Number.parseInt(mlObj.variableData[0].value),
        hatchCount: Number.parseInt(mlObj.variableData[1].value)
      },
      matchData: {},
      comments: mlObj.comments
    }
    res.matchData.lineData = this.getLineData();
    res.matchData.climbData = this.getClimbData();
    res.matchData.defenseData = {
      defense: this.getDefenseIntervals(),
      fieldCrossings: this.getCrossFieldData()
    };
    res.matchData.scoreData = this.getScoreIntervals();
    return res;
  }
  getLineData() {
    var res = {level: 0, timeStamp: 0};
    for(var i = 0;this.data[i].value < 17.5;i++) {
      if(this.data[i].key == "a" && res.level <= 1) {
        res.level = 2;
        res.timeStamp = this.data[i].value;
      }
      else if(this.data[i].key == "b" && res.level <= 0) {
        res.level = 1;
        res.timeStamp = this.data[i].value;
      }
    }
    return res;
  }
  getClimbData() {
    var res = {};
    var hasRes = false;
    var stop = false;
    var climbStart = 0;
    var lastClimb = 0;
    for(var i = this.data.length - 1;i >= 0 && !stop;i--) {
      if(this.data[i].key == "g" || this.data[i].key == "h" || this.data[i].key == "i" || this.data[i].key == "j" ||
         this.data[i].key == "k" || this.data[i].key == "l" || this.data[i].key == "m" || this.data[i].key == "n" ||
         this.data[i].key == "c" || this.data[i].key == "e") {
        stop = true;
      }
      if(this.data[i].key == "o" || this.data[i].key == "p" || this.data[i].key == "q" || this.data[i].key == "r") {
        if(hasRes) {
          climbStart = this.data[i].value;
        }
      }
      if(this.data[i].key == "o" && !hasRes) {
        hasRes = true;
        lastClimb = this.data[i].value;
        res.level = 1;
      }
      else if(this.data[i].key == "p" && !hasRes) {
        hasRes = true;
        lastClimb = this.data[i].value;
        res.level = 2;
      }
      else if(this.data[i].key == "q" && !hasRes) {
        hasRes = true;
        lastClimb = this.data[i].value;
        res.level = 3;
      }
      else if(this.data[i].key == "r" && !hasRes) {
        hasRes = true;
        lastClimb = this.data[i].value;
        res.level = 0;
      }
    }
    res.interval = lastClimb - climbStart;
    res.timeStamp = lastClimb;
    return res;
  }
  getCrossFieldData() {
    var res = [];
    for(var i = 0;i < this.data.length;i++) {
      if(this.data[i].key == "t") {
        res.push({timeStamp: this.data[i].value});
      }
    }
    return res;
  }
  getDefenseIntervals() {
    var res = [];
    var isDefending = false;
    var defendingStart = 0;
    var currDefending = 0;
    for(var i = 0;i < this.data.length;i++) {
      if(this.data[i].value - currDefending > 10 && isDefending) {
        res.push({
          interval: (currDefending + 10) - defendingStart,
          timeStamp: currDefending + 10
        });
      }
      if(this.data[i].key == "g" || this.data[i].key == "h" ||
         this.data[i].key == "i" || this.data[i].key == "j" ||
         this.data[i].key == "k" || this.data[i].key == "l" ||
         this.data[i].key == "m" || this.data[i].key == "n" ||
         this.data[i].key == "c" || this.data[i].key == "e") {
        if(isDefending) {
          res.push({
            interval: this.data[i].value - defendingStart,
            timeStamp: this.data[i].value
          });
        }
        isDefending = false;
      }
      if(this.data[i].key == "s") {
        if(!isDefending) {
          isDefending = true;
          defendingStart = this.data[i].value;
        }
        currDefending = this.data[i].value;
      }
    }
    return res;
  }
  getScoreIntervals() {
    var res = [];
    for(var i = 0;i < this.data.length;i++) {
      if(this.data[i].key == "g" || this.data[i].key == "h" ||
         this.data[i].key == "i" || this.data[i].key == "j" ||
         this.data[i].key == "k" || this.data[i].key == "l" ||
         this.data[i].key == "m" || this.data[i].key == "n") {
        var obj = this.getScoreInterval(i);
        obj.timeStamp = this.data[i].value;
        res.push(obj);
      }
    }
    return res;
  }
  getScoreInterval(index) {
    var intervalNoFailTmp = -1;
    var intervalWithFailTmp = -1;
    var scoreTypeTmp = "";
    var objectTypeTmp = "";
    var failedTmp = true;
    if(this.data[index].key == "g" || this.data[index].key == "h") { scoreTypeTmp = "cargoShip"; failedTmp = this.data[index].key == "h"; }
    if(this.data[index].key == "i" || this.data[index].key == "j") { scoreTypeTmp = "rocket1"; failedTmp = this.data[index].key == "j"; }
    if(this.data[index].key == "k" || this.data[index].key == "l") { scoreTypeTmp = "rocket2"; failedTmp = this.data[index].key == "l"; }
    if(this.data[index].key == "m" || this.data[index].key == "n") { scoreTypeTmp = "rocket3"; failedTmp = this.data[index].key == "n"; }
    var stop = false;
    for(var i = index - 1;i >= 0 && !stop;i--) {
      if(this.data[i].key == "g" || this.data[i].key == "h" ||
         this.data[i].key == "i" || this.data[i].key == "j" ||
         this.data[i].key == "k" || this.data[i].key == "l" ||
         this.data[i].key == "m" || this.data[i].key == "n") {
        stop = true;
      }
      if(this.data[i].key == "c" && objectTypeTmp == "hatch") { stop = true; }
      if(this.data[i].key == "e" && objectTypeTmp == "cargo") { stop = true; }
      if(this.data[i].key == "c" && !stop && objectTypeTmp == "cargo") { intervalWithFailTmp = this.data[index].value - this.data[i].value; }
      if(this.data[i].key == "e" && !stop && objectTypeTmp == "hatch") { intervalWithFailTmp = this.data[index].value - this.data[i].value; }
      if(this.data[i].key == "c" && intervalNoFailTmp == -1) { intervalNoFailTmp = this.data[index].value - this.data[i].value; intervalWithFailTmp = intervalNoFailTmp; objectTypeTmp = "cargo"; }
      if(this.data[i].key == "e" && intervalNoFailTmp == -1) { intervalNoFailTmp = this.data[index].value - this.data[i].value; intervalWithFailTmp = intervalNoFailTmp; objectTypeTmp = "hatch"; }
    }
    if(intervalNoFailTmp == -1) {
      intervalNoFailTmp = this.data[index].value;
      intervalWithFailTmp = intervalNoFailTmp
    }
    return {
      intervalNoFail: intervalNoFailTmp,
      intervalWithFail: intervalWithFailTmp,
      scoreType: scoreTypeTmp,
      objectType: objectTypeTmp,
      failed: failedTmp
    }
  }
}

module.exports = matchLoader;
