var tbaTable = {};

ipcRenderer.on("process-match-tba-track", (event, message) => {
  document.getElementById("loaderText").innerText = "Processing  " + (message.position + 1) + "/" + message.total + " files";
});

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
      tbaTable = new Tabulator("#tbaTable", {
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
          changeDate(row);
        }
      });
      tbaTable.setSort([
        {column:"date", dir:"desc"}
      ]);
      if(tableData.length <= 0) {document.getElementById("tbaTable").innerHTML = "";}
      window.setTimeout(() => {$('#display').dimmer('hide');}, 1000);
    });
    if(obj == {}) {
      ipcRenderer.send("query", {tbaData: null});
    }
    else {
      ipcRenderer.send("query", obj);
    }
  });
  ipcRenderer.send("process-match-tba", obj);
}

var changeDate = (row) => {
  $('#dateModal').modal("show");
  var newObj = Object.assign({}, row._row.data);
  var newLiteObj = ipcRenderer.sendSync("query-lite", {hash: newObj.hash})[0];
  document.getElementById("dateCal").innerHTML = "";
  $("#matchNumberMod").val(newLiteObj.matchNumber);
  var matchTypeArr = [
    {name: "Test Match",value: "T"},
    {name: "Practice Field Match",value: "PF"},
    {name: "Practice Match",value: "PM"},
    {name: "Qualification Match",value: "Q"},
    {name: "Quarterfinal Match",value: "QF"},
    {name: "Semifinal Match",value: "SF"},
    {name: "Final Match",value: "F"}
  ];
  for(var i = 0;i < matchTypeArr.length;i++) {
    if(matchTypeArr[i].value == newLiteObj.matchType){matchTypeArr[i].selected = true;}
  }
  $("#matchTypeMod").dropdown({placeholder: "Match Type", values: matchTypeArr});
  $('#dateCal').calendar({
    type: 'date',
    onChange: (date) => {
      var newLiteObj = ipcRenderer.sendSync("query-lite", {hash: newObj.hash})[0];
      newLiteObj.timeStamp = date.getTime();
      newLiteObj.matchNumber = Number.parseInt($("#matchNumberMod").val());
      newLiteObj.matchType = $("#matchTypeMod").dropdown("get value");
      ipcRenderer.once("update-lite-reply", () => {
        ipcRenderer.once("process-match-tba-reply", () => {
          $('#dateModal').modal("hide");
          //syncMatch();
          row.delete();
        });
        ipcRenderer.send("process-match-tba", {hash: newObj.hash});
      });
      ipcRenderer.send("update-lite", {filter: {hash: newObj.hash}, content: newLiteObj});
    },
    inline: true
  });
  document.getElementById("modLoad").onclick = () => {
    var newLiteObj = ipcRenderer.sendSync("query-lite", {hash: newObj.hash})[0];
    newLiteObj.matchNumber = Number.parseInt($("#matchNumberMod").val());
    newLiteObj.matchType = $("#matchTypeMod").dropdown("get value");
    ipcRenderer.once("update-lite-reply", () => {
      ipcRenderer.once("process-match-tba-reply", () => {
        $('#dateModal').modal("hide");
        //syncMatch();
        row.delete();
      });
      ipcRenderer.send("process-match-tba", {hash: newObj.hash});
    });
    ipcRenderer.send("update-lite", {filter: {hash: newObj.hash}, content: newLiteObj});
  }
}
