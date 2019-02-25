var stats = {};
var filter = {};
var table = {};

var calculate = () => {
  $('#display').dimmer('show');
  if($("#teamFilter").dropdown("get value") != "") {
    filter.targetTeam = {$in: $("#teamFilter").dropdown("get value").split(",").map((x) => {return Number.parseInt(x);})};
  }
  ipcRenderer.once("query-reply", (event, docs) => {
    var tableData = docs;
    for(var i = 0;i < tableData.length;i++) {
      tableData[i] = process(tableData[i]);
    }
    $("#dataTable").empty();
    table = new Tabulator("#dataTable", {
      data: tableData,
      columns: [
        {title: "Date", field: "date", headerFilter: true},
        {title: "Team Number", field: "targetTeam", headerFilter: true},
        {title: "Match Type", field: "matchType", headerFilter: true},
        {title: "Match Number", field: "matchNumber", headerFilter: true},
        {title: "Line Level", field: "counts.L"},
        {title: "Cargo Ship Hatch", field: "counts.H_CS"},
        {title: "Failed Cargo Ship Hatch", field: "counts.FH_CS"},
        {title: "Cargo Ship Cargo", field: "counts.C_CS"},
        {title: "Failed Cargo Ship Cargo", field: "counts.FC_CS"},
        {title: "Rocket Lvl 1 Hatch", field: "counts.H_R1"},
        {title: "Failed Rocket Lvl 1 Hatch", field: "counts.FH_R1"},
        {title: "Rocket Lvl 1 Cargo", field: "counts.C_R1"},
        {title: "Failed Rocket Lvl 1 Cargo", field: "counts.FC_R1"},
        {title: "Rocket Lvl 2 Hatch", field: "counts.H_R2"},
        {title: "Failed Rocket Lvl 2 Hatch", field: "counts.FH_R2"},
        {title: "Rocket Lvl 2 Cargo", field: "counts.C_R2"},
        {title: "Failed Rocket Lvl 2 Cargo", field: "counts.FC_R2"},
        {title: "Rocket Lvl 3 Hatch", field: "counts.H_R3"},
        {title: "Failed Rocket Lvl 3 Hatch", field: "counts.FH_R3"},
        {title: "Rocket Lvl 3 Cargo", field: "counts.C_R3"},
        {title: "Failed Rocket Lvl 3 Cargo", field: "counts.FC_R3"},
        {title: "Climb Level", field: "counts.C"},
        {title: "Defense", field: "counts.DF"},
        {title: "Field Crossings", field: "counts.FC"}
      ],
      pagination: "local",
      paginationSize: 13
    });
  });
  ipcRenderer.send("query", filter);
}

var download = () => {
  calculate();
  var arr = [];
  var string = "";
  if(filter.targetTeam != undefined) {
    arr = filter.targetTeam.$in;
    arr.sort((a,b) => {return a - b});
  }
  for(var i = 0;i < arr.length && i < 5;i++) {
    string += arr[i] + "-";
  }
  table.download("csv", string + "data.csv");
}

var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  $('#display').dimmer('show');
  ipcRenderer.once("query-stats-reply", (event, message) => {
    stats = message;
    var teamFilterList = [];
    for(var i = 0;i < stats.availableTeams.length;i++) {
      teamFilterList.push({name: stats.availableTeams[i].team.toString(), value: stats.availableTeams[i].team.toString()});
    }
    $("#teamFilter").dropdown({placeholder: "Team", values: teamFilterList});
    calculate();
  });
  ipcRenderer.send("query-stats");
}

$(document).ready(() => {sync();});
