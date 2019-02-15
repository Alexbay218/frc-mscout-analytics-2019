var stats = {};
var filter = {};
var table = {};

var calculate = () => {
  $('#display').dimmer('show');
  if($("#teamFilter").dropdown("get value") != "") {
    filter.targetTeam = {$in: $("#teamFilter").dropdown("get value").split(",").map((x) => {return Number.parseInt(x);})};
  }
  console.log(filter);
  ipcRenderer.on("query-reply", (event, docs) => {
    var tableData = docs;
    for(var i = 0;i < tableData.length;i++) {
      tableData[i].timeStamp = new Date(tableData[i].timeStamp);
      tableData[i].line = tableData[i].matchData.lineData.level;
      tableData[i].shipHatch = 0;
      tableData[i].shipCargo = 0;
      tableData[i].rocket1Hatch = 0;
      tableData[i].rocket1Cargo = 0;
      tableData[i].rocket2Hatch = 0;
      tableData[i].rocket2Cargo = 0;
      tableData[i].rocket3Hatch = 0;
      tableData[i].rocket3Cargo = 0;
      tableData[i].failedHatch = 0;
      tableData[i].failedCargo = 0;
      tableData[i].climb = tableData[i].matchData.climbData.level;
      tableData[i].defense = tableData[i].matchData.defenseData.defense.length;
      tableData[i].crossField = tableData[i].matchData.defenseData.fieldCrossings.length;
      for(var j = 0;j < tableData[i].matchData.scoreData.length;j++) {
        if(tableData[i].matchData.scoreData[j].objectType == "cargo") {
          if(tableData[i].matchData.scoreData[j].failed) {tableData[i].failedCargo++}
          else if(tableData[i].matchData.scoreData[j].scoreType == "cargoShip") {tableData[i].shipCargo++}
          else if(tableData[i].matchData.scoreData[j].scoreType == "rocket1") {tableData[i].rocket1Cargo++}
          else if(tableData[i].matchData.scoreData[j].scoreType == "rocket2") {tableData[i].rocket2Cargo++}
          else if(tableData[i].matchData.scoreData[j].scoreType == "rocket3") {tableData[i].rocket3Cargo++}
        }
        else {
          if(tableData[i].matchData.scoreData[j].failed) {tableData[i].failedHatch++}
          else if(tableData[i].matchData.scoreData[j].scoreType == "cargoShip") {tableData[i].shipHatch++}
          else if(tableData[i].matchData.scoreData[j].scoreType == "rocket1") {tableData[i].rocket1Hatch++}
          else if(tableData[i].matchData.scoreData[j].scoreType == "rocket2") {tableData[i].rocket2Hatch++}
          else if(tableData[i].matchData.scoreData[j].scoreType == "rocket3") {tableData[i].rocket3Hatch++}
        }
      }
    }
    $("#dataTable").empty();
    table = new Tabulator("#dataTable", {
      data: tableData,
      columns: [
        {title: "Date", field: "timeStamp", headerFilter: true},
        {title: "Team Number", field: "targetTeam", headerFilter: true},
        {title: "Match Type", field: "matchType", headerFilter: true},
        {title: "Match Number", field: "matchNumber", headerFilter: true},
        {title: "Line Level", field: "line"},
        {title: "Cargo Ship Hatch", field: "shipHatch"},
        {title: "Cargo Ship Cargo", field: "shipCargo"},
        {title: "Rocket Lvl 1 Hatch", field: "rocket1Hatch"},
        {title: "Rocket Lvl 1 Cargo", field: "rocket1Cargo"},
        {title: "Rocket Lvl 2 Hatch", field: "rocket2Hatch"},
        {title: "Rocket Lvl 2 Cargo", field: "rocket2Cargo"},
        {title: "Rocket Lvl 3 Hatch", field: "rocket3Hatch"},
        {title: "Rocket Lvl 3 Cargo", field: "rocket3Cargo"},
        {title: "Failed Hatch", field: "failedHatch"},
        {title: "Failed Cargo", field: "failedCargo"},
        {title: "Climb Level", field: "climb"},
        {title: "Defense", field: "defense"},
        {title: "Field Crossings", field: "crossField"}
      ],
      pagination: "local",
      paginationSize: 13
    });
    $('#display').dimmer('hide');
  });
  ipcRenderer.send("query", filter);
}

var download = () => {
  calculate();
  var arr = filter.targetTeam.$in;
  var string = "";
  arr.sort((a,b) => {return a - b});
  console.log(arr);
  for(var i = 0;i < arr.length && i < 5;i++) {
    string += arr[i] + "-";
  }
  table.download("csv", string + "data.csv")
}

var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  $('#display').dimmer('show');
  ipcRenderer.on("query-stats-reply", (event, message) => {
    stats = message;
    var teamFilterList = [];
    for(var i = 0;i < stats.availableTeams.length;i++) {
      teamFilterList.push({name: stats.availableTeams[i].team.toString(), value: stats.availableTeams[i].team.toString()});
    }
    console.log({placeholder: "team", values: teamFilterList});
    $("#teamFilter").dropdown({placeholder: "Team", values: teamFilterList});
    calculate();
  });
  ipcRenderer.send("query-stats");
}

$(document).ready(() => {sync();});
