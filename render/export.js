var stats = {};
var table = {};

var calculate = (callback = () => {}) => {
  $('#display').dimmer('show');
  ipcRenderer.once("query-reply", (event, docs) => {
    var tableData = docs;
    for(var i = 0;i < tableData.length;i++) {
      tableData[i] = process(tableData[i]);
      var currDate = (new Date(tableData[i].timeStamp));
      var str = (currDate.getMonth() + 1) + "/" + currDate.getDate() + "/" + currDate.getFullYear();
      tableData[i].dateStr = str;
    }
    $("#dataTable").empty();
    table = new Tabulator("#dataTable", {
      data: tableData,
      columns: [
        {title: "Date", field: "dateStr", headerFilter: true, sorter:"date", sorterParams:{format:"MM/DD/YYYY"}},
        {title: "Time Stamp", field: "timeStamp", headerFilter: true},
        {title: "Team Number", field: "targetTeam", headerFilter: true},
        {title: "Match Type", field: "matchType", headerFilter: true},
        {title: "Match Number", field: "matchNumber", headerFilter: true},
        {title: "Line Level", field: "counts.L"},
        {title: "Sandstorm Cargo Ship Hatch", field: "counts.S_H_CS"},
        {title: "Sandstorm Failed Cargo Ship Hatch", field: "counts.S_FH_CS"},
        {title: "Sandstorm Cargo Ship Cargo", field: "counts.S_C_CS"},
        {title: "Sandstorm Failed Cargo Ship Cargo", field: "counts.S_FC_CS"},
        {title: "Sandstorm Rocket Lvl 1 Hatch", field: "counts.S_H_R1"},
        {title: "Sandstorm Failed Rocket Lvl 1 Hatch", field: "counts.S_FH_R1"},
        {title: "Sandstorm Rocket Lvl 1 Cargo", field: "counts.S_C_R1"},
        {title: "Sandstorm Failed Rocket Lvl 1 Cargo", field: "counts.S_FC_R1"},
        {title: "Sandstorm Rocket Lvl 2 Hatch", field: "counts.S_H_R2"},
        {title: "Sandstorm Failed Rocket Lvl 2 Hatch", field: "counts.S_FH_R2"},
        {title: "Sandstorm Rocket Lvl 2 Cargo", field: "counts.S_C_R2"},
        {title: "Sandstorm Failed Rocket Lvl 2 Cargo", field: "counts.S_FC_R2"},
        {title: "Sandstorm Rocket Lvl 3 Hatch", field: "counts.S_H_R3"},
        {title: "Sandstorm Failed Rocket Lvl 3 Hatch", field: "counts.S_FH_R3"},
        {title: "Sandstorm Rocket Lvl 3 Cargo", field: "counts.S_C_R3"},
        {title: "Sandstorm Failed Rocket Lvl 3 Cargo", field: "counts.S_FC_R3"},
        {title: "Cargo Ship Hatch", field: "counts.NS_H_CS"},
        {title: "Failed Cargo Ship Hatch", field: "counts.NS_FH_CS"},
        {title: "Cargo Ship Cargo", field: "counts.NS_C_CS"},
        {title: "Failed Cargo Ship Cargo", field: "counts.NS_FC_CS"},
        {title: "Rocket Lvl 1 Hatch", field: "counts.NS_H_R1"},
        {title: "Failed Rocket Lvl 1 Hatch", field: "counts.NS_FH_R1"},
        {title: "Rocket Lvl 1 Cargo", field: "counts.NS_C_R1"},
        {title: "Failed Rocket Lvl 1 Cargo", field: "counts.NS_FC_R1"},
        {title: "Rocket Lvl 2 Hatch", field: "counts.NS_H_R2"},
        {title: "Failed Rocket Lvl 2 Hatch", field: "counts.NS_FH_R2"},
        {title: "Rocket Lvl 2 Cargo", field: "counts.NS_C_R2"},
        {title: "Failed Rocket Lvl 2 Cargo", field: "counts.NS_FC_R2"},
        {title: "Rocket Lvl 3 Hatch", field: "counts.NS_H_R3"},
        {title: "Failed Rocket Lvl 3 Hatch", field: "counts.NS_FH_R3"},
        {title: "Rocket Lvl 3 Cargo", field: "counts.NS_C_R3"},
        {title: "Failed Rocket Lvl 3 Cargo", field: "counts.NS_FC_R3"},
        {title: "Climb Level", field: "counts.C"},
        {title: "Defense", field: "counts.DF"},
        {title: "Field Crossings", field: "counts.FC"}
      ],
      pagination: "local",
      paginationSize: 12
    });
    callback();
    $('#display').dimmer('hide');
  });
  ipcRenderer.send("query", filterMatchesObj);
}

var download = () => {
  filterMatchesOnClick();
  calculate(() => {
    var arr = [];
    var string = "";
    if(filterMatchesObj.targetTeam != undefined) {
      arr = filterMatchesObj.targetTeam.$in;
      arr.sort((a,b) => {return a - b});
    }
    for(var i = 0;i < arr.length && i < 5;i++) {
      string += arr[i] + "-";
    }
    table.download("csv", string + "data.csv");
  });
}

var downloadRawJSON = () => {
  $('#display').dimmer('show');
  window.setTimeout(() => {
    var raw = ipcRenderer.sendSync("query", {});
    for(var i = 0;i < raw.length;i++) {
      raw[i] = process(raw[i]);
    }
    ipcRenderer.sendSync("save-raw", JSON.stringify(raw));
    $('#display').dimmer('hide');
  }, 500);
}

var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  //$('#display').dimmer('show');
  filterMatches("matchFilter", "calculate();");
  ipcRenderer.once("query-stats-reply", (event, message) => {
    stats = message;
    var teamFilterList = [];
    for(var i = 0;i < stats.availableTeams.length;i++) {
      teamFilterList.push({name: stats.availableTeams[i].team.toString(), value: stats.availableTeams[i].team.toString()});
    }
    $("#teamFilter").dropdown({placeholder: "Team", values: teamFilterList});
    //calculate();
  });
  ipcRenderer.send("query-stats");
}

$(document).ready(() => {sync();});
