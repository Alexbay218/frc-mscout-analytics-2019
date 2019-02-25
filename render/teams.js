var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  $('#display').dimmer('show');
  var stats = {};
  ipcRenderer.once("query-team-reply", (event, docs) => {
    var tableData = docs;
    for(var i = 0;i < stats.availableTeams.length;i++) {
      var found = false;
      for(var j = 0;j < tableData.length;j++) {
        if(tableData[j].team_number == stats.availableTeams[i].team) {tableData[j].totalMatches = stats.availableTeams[i].totalMatches;found = true;}
      }
      if(!found) {tableData.push({team_number: stats.availableTeams[i].team, totalMatches: stats.availableTeams[i].totalMatches, nickname: "Team " + stats.availableTeams[i].team})}
    }
    var table = new Tabulator("#teamTable", {
      data: tableData,
      layout: "fitColumns",
      columns: [
        {title: "Team Number", field: "team_number", headerFilter: true},
        {title: "Team Name", field: "nickname", headerFilter: true},
        {title: "Full Name", field: "name", headerFilter: true},
        {title: "City", field: "city", headerFilter: true},
        {title: "State or Province", field: "state_prov", headerFilter: true},
        {title: "Country", field: "country", headerFilter: true},
        {title:"Total Matches", field:"totalMatches"}
      ],
      pagination: "local",
      paginationSize: 13,
      rowClick: (e, row) => {
        ipcRenderer.sendSync("set-metadata", {targetTeam: row._row.data.team_number});
        ipcRenderer.sendSync("open-url","render/team.html");
      }
    });
    $('#display').dimmer('hide');
    table.setSort([
      {column:"team_number", dir:"asc"}
    ]);
  });
  ipcRenderer.once("query-stats-reply", (event, obj) => {
    var argList = [];
    stats = obj;
    for(var i = 0;i < obj.availableTeams.length;i++) {
      argList.push(obj.availableTeams[i].team);
    }
    argList.sort((a,b) => {return a - b});
    ipcRenderer.send("query-team", {team_number: {$in: argList}});
  });
  ipcRenderer.send("query-stats");
}

$(document).ready(() => {sync();});
