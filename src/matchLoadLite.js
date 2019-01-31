class matchLoaderLite {
  constructor() {
    this.md5 = require("md5");
  }
  commaSemiColonSplit(str) {
    var res = [];
    var newStr = str.slice();
    while(newStr.indexOf(";") != -1) {
      res.push({
        key: newStr.substr(0,newStr.indexOf(",")),
        value: newStr.substr(newStr.indexOf(",") + 1, newStr.indexOf(";") - newStr.indexOf(",") - 1)
      });
      newStr = newStr.substr(newStr.indexOf(";") + 1);
    }
    return res;
  }
  loadMatchLite(str) {
    if(str.length > 2048) {
      return null;
    }
    var newStr = str.slice();
    var metadata = newStr.substr(0,newStr.indexOf(":"));
    var sourceTeamTmp = metadata.substr(0,metadata.indexOf(";"));
    metadata = metadata.substr(metadata.indexOf(";")+1);
    var targetTeamTmp = metadata.substr(0,metadata.indexOf(";"));
    metadata = metadata.substr(metadata.indexOf(";")+1);
    var timeStampTmp = metadata.substr(0,metadata.indexOf(";"));
    metadata = metadata.substr(metadata.indexOf(";")+1);
    var matchTypeTmp = metadata.substr(0,metadata.indexOf(";"));
    metadata = metadata.substr(metadata.indexOf(";")+1);
    var matchNumberTmp = metadata.substr(0,metadata.indexOf(";"));
    newStr = newStr.substr(newStr.indexOf(":") + 1);
    var vardataTmp = newStr.substr(0,newStr.indexOf(":"));
    newStr = newStr.substr(newStr.indexOf(":") + 1);
    var dataTmp = newStr.substr(0,newStr.lastIndexOf(";")+1);
    newStr = newStr.substr(newStr.lastIndexOf(";") + 1);
    var commentTmp = newStr;
    return {
      raw: str,
      hash: this.md5(str),
      sourceTeam: Number.parseInt(sourceTeamTmp),
      targetTeam: Number.parseInt(targetTeamTmp),
      timeStamp: Number.parseInt(timeStampTmp),
      matchType: matchTypeTmp,
      matchNumber: Number.parseInt(matchNumberTmp),
      variableData: this.commaSemiColonSplit(vardataTmp),
      matchData: this.commaSemiColonSplit(dataTmp),
      comments: commentTmp
    }
  }
}

module.exports = matchLoaderLite;
