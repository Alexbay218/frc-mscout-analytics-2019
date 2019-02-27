var syncMatch = (obj) => {
  document.getElementById("loaderText").innerText = "";
  $('#display').dimmer('show');
  ipcRenderer.once("process-match-tba-reply", () => {
    ipcRenderer.once("query-reply", (event, docs) => {
      var tableData = docs;
      for(var i = 0;i < tableData.length;i++) {
        var currDate = (new Date(tableData[i].timeStamp));
        var str = (currDate.getMonth() + 1) + "/" + currDate.getDate() + "/" + currDate.getFullYear();
        tableData[i].date = str;
      }
      var table = new Tabulator("#tbaTable", {
        data: tableData,
        layout: "fitColumns",
        columns: [
          {title: "Date", field: "date", sorter:"date", sorterParams:{format:"MM/DD/YYYY"}},
          {title: "Target Team Number", field: "targetTeam", headerFilter: true},
          {title: "Match Type", field: "matchType", headerFilter: true},
          {title: "Match Number", field: "matchNumber", headerFilter: true}
        ],
        pagination: "local",
        paginationSize: 5,
        rowClick: (e, row) => {
          changeDate(row._row.data);
        }
      });
      table.setSort([
        {column:"date", dir:"desc"}
      ]);
      if(tableData.length <= 0) {document.getElementById("tbaTable").innerHTML = "";}
      window.setTimeout(() => {$('#display').dimmer('hide');}, 1000);
    });
    ipcRenderer.send("query", {tbaData: null});
  });
  ipcRenderer.send("process-match-tba", obj);
}

var changeDate = (data) => {
  $('#dateModal').modal("show");
  var newObj = Object.assign({}, data);
  $('#dateCal').calendar({
    type: 'date',
    onChange: (date) => {
      var newLiteObj = ipcRenderer.sendSync("query-lite", {hash: newObj.hash})[0];
      newLiteObj.timeStamp = date.getTime();
      ipcRenderer.once("update-lite-reply", () => {
        ipcRenderer.once("process-match-tba-reply", () => {
          $('#dateModal').modal("hide");
          syncMatch();
        });
        ipcRenderer.send("process-match-tba", {hash: newObj.hash});
      });
      ipcRenderer.send("update-lite", {filter: {hash: newObj.hash}, content: newLiteObj});
    }
  });
}
