var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  $('#display').dimmer('show');
  filterMatches("matchFilter", "query();");
  query();
}

var query = () => {
  ipcRenderer.once("query-lite-reply", (event, docs) => {
    var tableData = docs;
    for(var i = 0;i < tableData.length;i++) {
      var currDate = (new Date(tableData[i].timeStamp));
      var str = (currDate.getMonth() + 1) + "/" + currDate.getDate() + "/" + currDate.getFullYear();
      tableData[i].dateStr = str;
    }
    var table = new Tabulator("#matchTable", {
      data: tableData,
      layout: "fitColumns",
      columns: [
        {title: "Date", field: "dateStr", headerFilter: true, sorter:"date", sorterParams:{format:"MM/DD/YYYY"}},
        {title: "Match Type", field: "matchType", headerFilter: true},
        {title: "Match Number", field: "matchNumber", headerFilter: true},
        {title: "Team Number", field: "targetTeam", headerFilter: true},
        {title: "Credibility", field: "credibility", headerFilter: true}
      ],
      pagination: "local",
      paginationSize: 7,
      rowClick: (e, row) => {
        ipcRenderer.sendSync("set-metadata", {targetTeam: row._row.data.team_number});
        ipcRenderer.sendSync("open-url","render/team.html");
      }
    });
    $('#display').dimmer('hide');
  });
  ipcRenderer.send("query-lite", filterMatchesObj);
}

$(document).ready(() => {sync();});
