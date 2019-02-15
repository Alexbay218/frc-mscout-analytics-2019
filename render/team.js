var metadata = {};

var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  $('#display').dimmer('show');
  metadata = ipcRenderer.sendSync("get-metadata");
  if(metadata.targetTeam != undefined) {
    ipcRenderer.sendSync("set-metadata", {});
    ipcRenderer.on("query-team-reply", (event, docs) => {
      var team = docs[0];
      if(team != undefined && team != null) {
        document.getElementById("teamTitle").innerHTML = "Team " + team.team_number + " (" + team.nickname + ")  " + "<i id=\"countryFlag\"></i>";
        if(team.country != undefined && team.country != null) {
          document.getElementById("countryFlag").className = countryList.getCode(team.country) + " flag";
        }
        if(team.website != undefined && team.website != null && team.website.length < 45) {
          document.getElementById("teamUrl").innerText = team.website;
          document.getElementById("teamUrl").onclick = () => {require('electron').shell.openExternal(team.website);};
        }
        else {
          document.getElementById("teamUrl").style.display = "none";
        }
        if(team.motto != undefined && team.motto != null) {
          document.getElementById("teamMottoText").innerText = team.motto;
        }
        else {
          document.getElementById("teamMotto").style.display = "none";
        }
        if(team.rookie_year != null && team.rookie_year != undefined) {
          document.getElementById("teamRookieYearText").innerText = "Rookie Year: " + team.rookie_year;
        }
        else {
          document.getElementById("teamRookieYear").style.display = "none";
        }
        document.getElementById("tbaUrl").innerText = "https://www.thebluealliance.com/team/" + team.team_number;
        document.getElementById("tbaUrl").onclick = () => {require('electron').shell.openExternal("https://www.thebluealliance.com/team/" + team.team_number);};
      }
      else {
        document.getElementById("teamTitle").innerText = "Team " + metadata.targetTeam;
        document.getElementById("teamUrl").style.display = "none";
        document.getElementById("teamRookieYear").style.display = "none";
        document.getElementById("teamMotto").style.display = "none";
        document.getElementById("tbaUrl").style.display = "none";
      }
      teamData(team);
    });
    ipcRenderer.send("query-team", {team_number: metadata.targetTeam});
  }
  else {router.teams()}
}

var teamData = (team) => {
  ipcRenderer.on("query-reply", (e, docs) =>{
    var tableData = docs;
    var comments = [];
    var sumAccuracy = 0;
    var sumScore = 0;
    for(var i = 0;i < tableData.length;i++) {
      tableData[i] = process(tableData[i]);
      tableData[i].score = tableData[i].scoring.L + tableData[i].scoring.C + tableData[i].scoring.C_CS + tableData[i].scoring.H_CS;
      tableData[i].score += tableData[i].scoring.C_R1 + tableData[i].scoring.H_R1;
      tableData[i].score += tableData[i].scoring.C_R2 + tableData[i].scoring.H_R2;
      tableData[i].score += tableData[i].scoring.C_R3 + tableData[i].scoring.H_R3;
      tableData[i].PS = tableData[i].counts.C_CS + tableData[i].counts.H_CS;
      tableData[i].PS += tableData[i].counts.C_R1 + tableData[i].counts.H_R1;
      tableData[i].PS += tableData[i].counts.C_R2 + tableData[i].counts.H_R2;
      tableData[i].PS += tableData[i].counts.C_R3 + tableData[i].counts.H_R3;
      tableData[i].PF = tableData[i].counts.FC_CS + tableData[i].counts.FH_CS;
      tableData[i].PF += tableData[i].counts.FC_R1 + tableData[i].counts.FH_R1;
      tableData[i].PF += tableData[i].counts.FC_R2 + tableData[i].counts.FH_R2;
      tableData[i].PF += tableData[i].counts.FC_R3 + tableData[i].counts.FH_R3;
      tableData[i].percentage = Number.parseFloat((tableData[i].PS/(tableData[i].PS+tableData[i].PF)).toFixed(2));
      sumAccuracy += tableData[i].percentage;
      sumScore += tableData[i].score;
      comments.push(tableData[i].comments);
    }
    comments.sort((a,b) => {return b.length - a.length});
    var table = new Tabulator("#matchTable", {
      data: tableData,
      layout: "fitColumns",
      columns: [
        {title: "Date", field: "date", headerFilter: true},
        {title: "Match Type", field: "matchType", headerFilter: true},
        {title: "Match Number", field: "matchNumber", headerFilter: true},
        {title: "Score", field: "score"},
        {title: "Scoring Accuracy", field: "percentage"},
        {title: "Credibility", field: "credibility", headerFilter: true}
      ],
      pagination: "local",
      paginationSize: 5
    });
    table.setSort([
      {column:"matchType", dir:"asc"},
      {column:"matchNumber", dir:"asc"}
    ]);
    document.getElementById("totalMatches").innerText = docs.length;
    document.getElementById("avgAccuracy").innerText = Number.parseFloat(((sumAccuracy/docs.length)*100).toFixed(2));
    document.getElementById("avgScore").innerText = Number.parseFloat((sumScore/docs.length).toFixed(2));
    var commentsListElem = document.getElementById("commentList");
    for(var i = 0;i < comments.length;i++) {
      if(comments[i].length > 0 && comments[i].length <= 500) {
        commentsListElem.insertAdjacentHTML("beforeend",
          "<div class=\"item\">" +
            "<i class=\"quote left icon left aligned\">" +
            "</i><div class=\"content\" style=\"word-break:break-all;width:" + (document.getElementById("teamInfo").offsetWidth - 80) +
            "px\">" +
            comments[i] +
            "</div><i class=\"quote right icon right aligned\"></i>" +
          "</div>"
        );
      }
    }
    commentsListElem.style.overflow = "auto";
    commentsListElem.style.height = document.getElementById("teamInfo").offsetHeight - 85 + "px";
    charts(tableData);
    $('#display').dimmer('hide');
    document.getElementById("sidebar").style.height = document.body.scrollHeight + "px";
  });
  ipcRenderer.send("query", {targetTeam: metadata.targetTeam});
}

var charts = (docs) => {
  var ctx = document.getElementById('cvht').getContext('2d');
  var chartData = {};
  chartData.cvht = {
      labels: ["Failing at Scoring Cargo", "Scoring Cargo", "Picking up Cargo", "Failing at Scoring Hatch", "Scoring Hatch", "Picking up Hatch"],
      datasets: [{
          label: "Cargo vs Hatch by Time",
          data: [
            avgSums(docs, "times", "FC_CS") +
            avgSums(docs, "times", "FC_R1") +
            avgSums(docs, "times", "FC_R2") +
            avgSums(docs, "times", "FC_R3"),
            avgSums(docs, "times", "C_CS") +
            avgSums(docs, "times", "C_R1") +
            avgSums(docs, "times", "C_R2") +
            avgSums(docs, "times", "C_R3"),
            avgSums(docs, "times", "TC_CS") +
            avgSums(docs, "times", "TC_R1") +
            avgSums(docs, "times", "TC_R2") +
            avgSums(docs, "times", "TC_R3"),
            avgSums(docs, "times", "FH_CS") +
            avgSums(docs, "times", "FH_R1") +
            avgSums(docs, "times", "FH_R2") +
            avgSums(docs, "times", "FH_R3"),
            avgSums(docs, "times", "H_CS") +
            avgSums(docs, "times", "H_R1") +
            avgSums(docs, "times", "H_R2") +
            avgSums(docs, "times", "H_R3"),
            avgSums(docs, "times", "TH_CS") +
            avgSums(docs, "times", "TH_R1") +
            avgSums(docs, "times", "TH_R2") +
            avgSums(docs, "times", "TH_R3")
          ],
          backgroundColor:["#cc5200", "#ff6600", "#ffb380", "#cccc00", "#ffff00", "#ffff80"]
      }]
  };
  var chart = new Chart(ctx, {
    type: "doughnut",
    data: chartData.cvht,
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            var label = data.labels[tooltipItem.index] || '';
            if (label) {
              label += ': ';
              label += Math.round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]*100)/100;
              label += " secs (";
              sum = 0;
              for(var i = 0;i < data.datasets[tooltipItem.datasetIndex].data.length;i++) {
                var tmp = data.datasets[tooltipItem.datasetIndex]._meta;
                if(!tmp[Object.keys(tmp)[0]].data[i].hidden) {
                  sum += data.datasets[tooltipItem.datasetIndex].data[i];
                }
              }
              label += Math.round(10000*data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]/sum)/100;
              label += "%)";
            }
            return label;
          }
        }
      },
      aspectRatio: 1.75,
      legend: {position: "left"}
    }
  });
  var ctx = document.getElementById('cvha').getContext('2d');
  chartData.cvha = {
      labels: ["Failing at Scoring Cargo", "Scoring Cargo", "Failing at Scoring Hatch", "Scoring Hatch"],
      datasets: [{
          label: "Cargo vs Hatch by Attempts",
          data: [
            avgSums(docs, "counts", "FC_CS") +
            avgSums(docs, "counts", "FC_R1") +
            avgSums(docs, "counts", "FC_R2") +
            avgSums(docs, "counts", "FC_R3"),
            avgSums(docs, "counts", "C_CS") +
            avgSums(docs, "counts", "C_R1") +
            avgSums(docs, "counts", "C_R2") +
            avgSums(docs, "counts", "C_R3"),
            avgSums(docs, "counts", "FH_CS") +
            avgSums(docs, "counts", "FH_R1") +
            avgSums(docs, "counts", "FH_R2") +
            avgSums(docs, "counts", "FH_R3"),
            avgSums(docs, "counts", "H_CS") +
            avgSums(docs, "counts", "H_R1") +
            avgSums(docs, "counts", "H_R2") +
            avgSums(docs, "counts", "H_R3")
          ],
          backgroundColor:["#cc5200", "#ff6600", "#cccc00", "#ffff00"]
      }]
  };
  var chart = new Chart(ctx, {
    type: "doughnut",
    data: chartData.cvha,
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            var label = data.labels[tooltipItem.index] || '';
            if (label) {
              label += ': ';
              label += Math.round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]*100)/100;
              label += " times (";
              sum = 0;
              for(var i = 0;i < data.datasets[tooltipItem.datasetIndex].data.length;i++) {
                var tmp = data.datasets[tooltipItem.datasetIndex]._meta;
                if(!tmp[Object.keys(tmp)[0]].data[i].hidden) {
                  sum += data.datasets[tooltipItem.datasetIndex].data[i];
                }
              }
              label += Math.round(10000*data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]/sum)/100;
              label += "%)";
            }
            return label;
          }
        }
      },
      aspectRatio: 1.75,
      legend: {position: "right"}
    }
  });
  var ctx = document.getElementById('cvhs').getContext('2d');
  chartData.cvhs = {
      labels: ["Scoring Cargo", "Scoring Hatch"],
      datasets: [{
          label: "Cargo vs Hatch by Score",
          data: [
            avgSums(docs, "scoring", "C_CS") +
            avgSums(docs, "scoring", "C_R1") +
            avgSums(docs, "scoring", "C_R2") +
            avgSums(docs, "scoring", "C_R3"),
            avgSums(docs, "scoring", "H_CS") +
            avgSums(docs, "scoring", "H_R1") +
            avgSums(docs, "scoring", "H_R2") +
            avgSums(docs, "scoring", "H_R3")
          ],
          backgroundColor:["#ff6600", "#ffff00"]
      }]
  };
  var chart = new Chart(ctx, {
    type: "doughnut",
    data: chartData.cvhs,
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            var label = data.labels[tooltipItem.index] || '';
            if (label) {
              label += ': ';
              label += Math.round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]*100)/100;
              label += " points (";
              sum = 0;
              for(var i = 0;i < data.datasets[tooltipItem.datasetIndex].data.length;i++) {
                var tmp = data.datasets[tooltipItem.datasetIndex]._meta;
                if(!tmp[Object.keys(tmp)[0]].data[i].hidden) {
                  sum += data.datasets[tooltipItem.datasetIndex].data[i];
                }
              }
              label += Math.round(10000*data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]/sum)/100;
              label += "%)";
            }
            return label;
          }
        }
      },
      aspectRatio: 1.75,
      legend: {position: "left"}
    }
  });
  var ctx = document.getElementById('csvrt').getContext('2d');
  chartData.csvrt = {
      labels: [
        "Failing at scoring on Cargo Ship", "Scoring on Cargo Ship", "Trying to score on Cargo Ship",
        "Failing at scoring on Rocket Level 1", "Scoring on Rocket Level 1", "Trying to score on Rocket Level 1",
        "Failing at scoring on Rocket Level 2", "Scoring on Rocket Level 2", "Trying to score on Rocket Level 2",
        "Failing at scoring on Rocket Level 3", "Scoring on Rocket Level 3", "Trying to score on Rocket Level 3"
      ],
      datasets: [{
          label: "Cargo Ship vs Rocket by Time",
          data: [
            avgSums(docs, "times", "FC_CS") + avgSums(docs, "times", "FH_CS"),
            avgSums(docs, "times", "C_CS") + avgSums(docs, "times", "H_CS"),
            avgSums(docs, "times", "TC_CS") + avgSums(docs, "times", "TH_CS"),
            avgSums(docs, "times", "FC_R1") + avgSums(docs, "times", "FH_R1"),
            avgSums(docs, "times", "C_R1") + avgSums(docs, "times", "H_R1"),
            avgSums(docs, "times", "TC_R1") + avgSums(docs, "times", "TH_R1"),
            avgSums(docs, "times", "FC_R2") + avgSums(docs, "times", "FH_R2"),
            avgSums(docs, "times", "C_R2") + avgSums(docs, "times", "H_R2"),
            avgSums(docs, "times", "TC_R2") + avgSums(docs, "times", "TH_R2"),
            avgSums(docs, "times", "FC_R3") + avgSums(docs, "times", "FH_R3"),
            avgSums(docs, "times", "C_R3") + avgSums(docs, "times", "H_R3"),
            avgSums(docs, "times", "TC_R3") + avgSums(docs, "times", "TH_R3")
          ],
          backgroundColor:[
            "#cc0000", "#ff0000", "#ff8080",
            "#00cc00", "#00ff00", "#80ff80",
            "#00cccc", "#00ffff", "#80ffff",
            "#0000cc", "#0000ff", "#8080ff"
          ]
      }]
  };
  var chart = new Chart(ctx, {
    type: "doughnut",
    data: chartData.csvrt,
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            var label = data.labels[tooltipItem.index] || '';
            if (label) {
              label += ': ';
              label += Math.round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]*100)/100;
              label += " secs (";
              sum = 0;
              for(var i = 0;i < data.datasets[tooltipItem.datasetIndex].data.length;i++) {
                var tmp = data.datasets[tooltipItem.datasetIndex]._meta;
                if(!tmp[Object.keys(tmp)[0]].data[i].hidden) {
                  sum += data.datasets[tooltipItem.datasetIndex].data[i];
                }
              }
              label += Math.round(10000*data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]/sum)/100;
              label += "%)";
            }
            return label;
          }
        }
      },
      aspectRatio: 1.75,
      legend: {position: "right"}
    }
  });
  var ctx = document.getElementById('csvra').getContext('2d');
  chartData.csvra = {
      labels: [
        "Failing at scoring on Cargo Ship", "Scoring on Cargo Ship",
        "Failing at scoring on Rocket Level 1", "Scoring on Rocket Level 1",
        "Failing at scoring on Rocket Level 2", "Scoring on Rocket Level 2",
        "Failing at scoring on Rocket Level 3", "Scoring on Rocket Level 3"
      ],
      datasets: [{
          label: "Cargo Ship vs Rocket by Attempts",
          data: [
            avgSums(docs, "counts", "FC_CS") + avgSums(docs, "counts", "FH_CS"),
            avgSums(docs, "counts", "C_CS") + avgSums(docs, "counts", "H_CS"),
            avgSums(docs, "counts", "FC_R1") + avgSums(docs, "counts", "FH_R1"),
            avgSums(docs, "counts", "C_R1") + avgSums(docs, "counts", "H_R1"),
            avgSums(docs, "counts", "FC_R2") + avgSums(docs, "counts", "FH_R2"),
            avgSums(docs, "counts", "C_R2") + avgSums(docs, "counts", "H_R2"),
            avgSums(docs, "counts", "FC_R3") + avgSums(docs, "counts", "FH_R3"),
            avgSums(docs, "counts", "C_R3") + avgSums(docs, "counts", "H_R3")
          ],
          backgroundColor:[
            "#cc0000", "#ff0000",
            "#00cc00", "#00ff00",
            "#00cccc", "#00ffff",
            "#0000cc", "#0000ff"
          ]
      }]
  };
  var chart = new Chart(ctx, {
    type: "doughnut",
    data: chartData.csvra,
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            var label = data.labels[tooltipItem.index] || '';
            if (label) {
              label += ': ';
              label += Math.round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]*100)/100;
              label += " times (";
              sum = 0;
              for(var i = 0;i < data.datasets[tooltipItem.datasetIndex].data.length;i++) {
                var tmp = data.datasets[tooltipItem.datasetIndex]._meta;
                if(!tmp[Object.keys(tmp)[0]].data[i].hidden) {
                  sum += data.datasets[tooltipItem.datasetIndex].data[i];
                }
              }
              label += Math.round(10000*data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]/sum)/100;
              label += "%)";
            }
            return label;
          }
        }
      },
      aspectRatio: 1.75,
      legend: {position: "left"}
    }
  });
  var ctx = document.getElementById('csvrs').getContext('2d');
  chartData.csvrs = {
      labels: [
        "Scoring on Cargo Ship",
        "Scoring on Rocket Level 1",
        "Scoring on Rocket Level 2",
        "Scoring on Rocket Level 3"
      ],
      datasets: [{
          label: "Cargo Ship vs Rocket by Score",
          data: [
            avgSums(docs, "scoring", "C_CS") + avgSums(docs, "scoring", "H_CS"),
            avgSums(docs, "scoring", "C_R1") + avgSums(docs, "scoring", "H_R1"),
            avgSums(docs, "scoring", "C_R2") + avgSums(docs, "scoring", "H_R2"),
            avgSums(docs, "scoring", "C_R3") + avgSums(docs, "scoring", "H_R3")
          ],
          backgroundColor:[
            "#ff0000",
            "#00ff00",
            "#00ffff",
            "#0000ff"
          ]
      }]
  };
  var chart = new Chart(ctx, {
    type: "doughnut",
    data: chartData.csvrs,
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            var label = data.labels[tooltipItem.index] || '';
            if (label) {
              label += ': ';
              label += Math.round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]*100)/100;
              label += " points (";
              sum = 0;
              for(var i = 0;i < data.datasets[tooltipItem.datasetIndex].data.length;i++) {
                var tmp = data.datasets[tooltipItem.datasetIndex]._meta;
                if(!tmp[Object.keys(tmp)[0]].data[i].hidden) {
                  sum += data.datasets[tooltipItem.datasetIndex].data[i];
                }
              }
              label += Math.round(10000*data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]/sum)/100;
              label += "%)";
            }
            return label;
          }
        }
      },
      aspectRatio: 1.75,
      legend: {position: "right"}
    }
  });
  var ctx = document.getElementById('svdt').getContext('2d');
  chartData.svdt = {
      labels: [
        "Hab Line", "Failing at Scoring Cargo", "Scoring Cargo", "Picking up Cargo", "Failing at Scoring Hatch", "Scoring Hatch", "Picking up Hatch", "Defense", "Climb", "Nothing"
      ],
      datasets: [{
          label: "Scoring Types by Time",
          data: [
            avgSums(docs, "times", "L"),
            avgSums(docs, "times", "FC_CS") +
            avgSums(docs, "times", "FC_R1") +
            avgSums(docs, "times", "FC_R2") +
            avgSums(docs, "times", "FC_R3"),
            avgSums(docs, "times", "C_CS") +
            avgSums(docs, "times", "C_R1") +
            avgSums(docs, "times", "C_R2") +
            avgSums(docs, "times", "C_R3"),
            avgSums(docs, "times", "TC_CS") +
            avgSums(docs, "times", "TC_R1") +
            avgSums(docs, "times", "TC_R2") +
            avgSums(docs, "times", "TC_R3"),
            avgSums(docs, "times", "FH_CS") +
            avgSums(docs, "times", "FH_R1") +
            avgSums(docs, "times", "FH_R2") +
            avgSums(docs, "times", "FH_R3"),
            avgSums(docs, "times", "H_CS") +
            avgSums(docs, "times", "H_R1") +
            avgSums(docs, "times", "H_R2") +
            avgSums(docs, "times", "H_R3"),
            avgSums(docs, "times", "TH_CS") +
            avgSums(docs, "times", "TH_R1") +
            avgSums(docs, "times", "TH_R2") +
            avgSums(docs, "times", "TH_R3"),
            avgSums(docs, "times", "DF"),
            avgSums(docs, "times", "C"),
            avgSums(docs, "times", "N")
          ],
          backgroundColor:[
            "#ff0000", "#cc5200", "#ff6600", "#ffb380", "#cccc00", "#ffff00", "#ffff80", "#0000ff", "#9966ff", "#a6a6a6"
          ]
      }]
  };
  var chart = new Chart(ctx, {
    type: "doughnut",
    data: chartData.svdt,
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            var label = data.labels[tooltipItem.index] || '';
            if (label) {
              label += ': ';
              label += Math.round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]*100)/100;
              label += " secs (";
              sum = 0;
              for(var i = 0;i < data.datasets[tooltipItem.datasetIndex].data.length;i++) {
                var tmp = data.datasets[tooltipItem.datasetIndex]._meta;
                if(!tmp[Object.keys(tmp)[0]].data[i].hidden) {
                  sum += data.datasets[tooltipItem.datasetIndex].data[i];
                }
              }
              label += Math.round(10000*data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]/sum)/100;
              label += "%)";
            }
            return label;
          }
        }
      },
      aspectRatio: 1.75,
      legend: {position: "left"}
    }
  });
  var ctx = document.getElementById('svds').getContext('2d');
  chartData.svds = {
      labels: [
        "Hab Line", "Scoring Cargo", "Scoring Hatch", "Climb"
      ],
      datasets: [{
          label: "Scoring Types by Score",
          data: [
            avgSums(docs, "scoring", "L"),
            avgSums(docs, "scoring", "C_CS") +
            avgSums(docs, "scoring", "C_R1") +
            avgSums(docs, "scoring", "C_R2") +
            avgSums(docs, "scoring", "C_R3"),
            avgSums(docs, "scoring", "H_CS") +
            avgSums(docs, "scoring", "H_R1") +
            avgSums(docs, "scoring", "H_R2") +
            avgSums(docs, "scoring", "H_R3"),
            avgSums(docs, "scoring", "C")
          ],
          backgroundColor:[
            "#ff0000", "#ff6600", "#ffff00", "#9966ff"
          ]
      }]
  };
  var chart = new Chart(ctx, {
    type: "doughnut",
    data: chartData.svds,
    options: {
      tooltips: {
        callbacks: {
          label: function(tooltipItem, data) {
            var label = data.labels[tooltipItem.index] || '';
            if (label) {
              label += ': ';
              label += Math.round(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]*100)/100;
              label += " points (";
              sum = 0;
              for(var i = 0;i < data.datasets[tooltipItem.datasetIndex].data.length;i++) {
                var tmp = data.datasets[tooltipItem.datasetIndex]._meta;
                if(!tmp[Object.keys(tmp)[0]].data[i].hidden) {
                  sum += data.datasets[tooltipItem.datasetIndex].data[i];
                }
              }
              label += Math.round(10000*data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]/sum)/100;
              label += "%)";
            }
            return label;
          }
        }
      },
      aspectRatio: 1.75,
      legend: {position: "right"}
    }
  });
  var ctx = document.getElementById('sot').getContext('2d');
  chartData.sot = {
      datasets: [
        {
            label: "Hab Line",
            data: arrsDate(docs, "scoring", ["L"]),
            borderColor: "#ff0000",
            fill: false
        },
        {
            label: "Cargo",
            data: arrsDate(docs, "scoring", ["C_CS", "C_R1", "C_R2", "C_R3"]),
            borderColor: "#ff6600",
            fill: false
        },
        {
            label: "Hatch",
            data: arrsDate(docs, "scoring", ["H_CS", "H_R1", "H_R2", "H_R3"]),
            borderColor: "#ffff00",
            fill: false
        },
        {
            label: "Climb",
            data: arrsDate(docs, "scoring", ["C"]),
            borderColor: "#9966ff",
            fill: false
        },
        {
            label: "Total",
            data: arrsDate(docs, "scoring", ["L", "C_CS", "C_R1", "C_R2", "C_R3", "H_CS", "H_R1", "H_R2", "H_R3", "C"]),
            borderColor: "#000000",
            fill: false
        }
      ]
  };
  var chart = new Chart(ctx, {
    type: "line",
    data: chartData.sot,
    options: {
      scales: {
          xAxes: [{
              type: 'time',
              distribution: 'series',
              time: {
                  unit: 'week'
              },
              ticks: {
                  minRotation: 70,
                  maxRotation: 90
              }
          }]
      }
    }
  });
}

$(document).ready(() => {sync();});
