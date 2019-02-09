var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  $('#display').dimmer('show');
  var metadata = ipcRenderer.sendSync("get-metadata");
  if(metadata.targetTeam != undefined) {
    ipcRenderer.sendSync("set-metadata", {});
    ipcRenderer.on("query-team-reply", (event, docs) => {
      var team = docs[0];
      document.getElementById("teamTitle").innerText = "Team " + team.team_number + " (" + team.nickname + ")";
      teamData(team);
    });
    ipcRenderer.send("query-team", {team_number: metadata.targetTeam});
  }
  else {router.teams()}
}

var teamData = (team) => {
  ipcRenderer.on("query-reply", (e, docs) =>{
    var tableData = docs;
    for(var i = 0;i < docs.length;i++) {
      docs[i].timeStamp = new Date(docs[i].timeStamp);
      docs[i].score = 0;
      var sumScored = 0;
      docs[i].intervals = {
        defense: 0,
        line: 0,
        climb: 0,
        cargo: 0,
        tryingCargo: 0,
        failedCargo: 0,
        hatch: 0,
        tryingHatch: 0,
        failedHatch: 0,
        nothing: 0
      };
      docs[i].score += docs[i].matchData.lineData.level * 3;
      docs[i].score += docs[i].matchData.climbData.level * 3;
      for(var j = 0;j < docs[i].matchData.scoreData.length;j++) {
        if(!docs[i].matchData.scoreData[j].failed) {
          if(docs[i].matchData.scoreData[j].objectType == "cargo") {
            docs[i].score += 3;
            docs[i].intervals.cargo += docs[i].matchData.scoreData[j].intervalNoFail;
            docs[i].intervals.tryingCargo += docs[i].matchData.scoreData[j].intervalWithFail - docs[i].matchData.scoreData[j].intervalNoFail;
          }
          else {
            docs[i].score += 2;
            docs[i].intervals.hatch += docs[i].matchData.scoreData[j].intervalNoFail;
            docs[i].intervals.tryingHatch += docs[i].matchData.scoreData[j].intervalWithFail - docs[i].matchData.scoreData[j].intervalNoFail;
          }
          sumScored++;
        }
        else {
          if(docs[i].matchData.scoreData[j].objectType == "cargo") {
            docs[i].intervals.failedCargo += docs[i].matchData.scoreData[j].intervalNoFail;
            docs[i].intervals.tryingCargo += docs[i].matchData.scoreData[j].intervalWithFail - docs[i].matchData.scoreData[j].intervalNoFail;
          }
          else {
            docs[i].intervals.failedHatch += docs[i].matchData.scoreData[j].intervalNoFail;
            docs[i].intervals.tryingHatch += docs[i].matchData.scoreData[j].intervalWithFail - docs[i].matchData.scoreData[j].intervalNoFail;
          }
        }
      }
      docs[i].percentage = Number.parseFloat((sumScored/docs[i].matchData.scoreData.length).toFixed(2));
      for(var j = 0;j < docs[i].matchData.defenseData.defense.length;j++) {
        docs[i].intervals.defense += docs[i].matchData.defenseData.defense[j].interval;
      }
      docs[i].intervals.line += docs[i].matchData.lineData.timeStamp;
      docs[i].intervals.climb += docs[i].matchData.climbData.interval;
      docs[i].intervals.nothing = 150 - docs[i].intervals.defense - docs[i].intervals.line - docs[i].intervals.climb - docs[i].intervals.cargo - docs[i].intervals.hatch;
      docs[i].intervals.nothing = docs[i].intervals.nothing - docs[i].intervals.tryingCargo - docs[i].intervals.tryingHatch - docs[i].intervals.failedCargo - docs[i].intervals.failedHatch;
    }
    console.log(docs);
    var table = new Tabulator("#matchTable", {
      data: tableData,
      layout: "fitColumns",
      columns: [
        {title: "Date", field: "timeStamp", headerFilter: true},
        {title: "Match Type", field: "matchType", headerFilter: true},
        {title: "Match Number", field: "matchNumber", headerFilter: true},
        {title: "Score", field: "score", topCalc: "avg", topCalcParams: {precision: 2}},
        {title: "Scoring Accuracy", field: "percentage", topCalc: "avg", topCalcParams: {precision: 2}},
        {title: "Credibility", field: "credibility", headerFilter: true}
      ],
      pagination: "local",
      paginationSize: 5
    });
    table.setSort([
      {column:"matchType", dir:"asc"},
      {column:"matchNumber", dir:"asc"}
    ]);
    var percentagesElem = document.getElementById("percentages");
    var ctx = percentagesElem.getContext('2d');
    var data = {
        datasets: [{
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: ["#748aff", "#00ccff", "#00ff99", "#ff6600", "#ffa366", "#fff0e6", "#ffff33", "#ffffb3", "#ffffe6", "#d9d9d9"]
        }],
        labels: [
            "Defense",
            "Line",
            "Climb",
            "Cargo Scoring",
            "Cargo Grabbing",
            "Failing Cargo Scoring",
            "Hatch Scoring",
            "Hatch Scoring",
            "Failing Hatch Scoring",
            "Nothing"
        ]
    };
    for(var i = 0;i < docs.length;i++) {
      data.datasets[0].data[0] += docs[i].intervals.defense;
      data.datasets[0].data[1] += docs[i].intervals.line;
      data.datasets[0].data[2] += docs[i].intervals.climb;
      data.datasets[0].data[3] += docs[i].intervals.cargo;
      data.datasets[0].data[4] += docs[i].intervals.tryingCargo;
      data.datasets[0].data[5] += docs[i].intervals.failedCargo;
      data.datasets[0].data[6] += docs[i].intervals.hatch;
      data.datasets[0].data[7] += docs[i].intervals.tryingHatch;
      data.datasets[0].data[8] += docs[i].intervals.failedHatch;
      data.datasets[0].data[9] += docs[i].intervals.defense;
    }
    var pChart = new Chart(ctx,{
        type: 'doughnut',
        data: data
    });
    $('#display').dimmer('hide');
  });
  ipcRenderer.send("query", {targetTeam: team.team_number});
}

$(document).ready(() => {sync();});
