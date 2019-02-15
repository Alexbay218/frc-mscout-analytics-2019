var sync = () => {
  $("#display").transition("fade in", "500ms");

  $('#TMSBox').dimmer({closable:false}).dimmer('show');
  $('#TeamStatBox').dimmer({closable:false}).dimmer('show');
  $('#MatchCalBox').dimmer({closable:false}).dimmer('show');
  ipcRenderer.on("query-stats-reply", (event, message) => {
    var obj = message;
    //doughnut chart
    var totalMatElem = document.getElementById("totalMatches");
    var ctx = totalMatElem.getContext('2d');
    var data = {
        datasets: [{
            data: [0, 0],
            backgroundColor: [
                "#ff6666",
                "#748aff"
            ]
        }],
        labels: [
            'Matches without TBA Data',
            'Matches with TBA Data'
        ]
    };
    data.datasets[0].data[0] = obj.totalMatches - obj.tbaMatches;
    data.datasets[0].data[1] = obj.tbaMatches;
    document.getElementById("tM").innerHTML = obj.totalMatches;
    document.getElementById("tT").innerHTML = obj.availableTeams.length;
    if(obj.totalMatches != 0) {
      var tMChart = new Chart(ctx,{
          type: 'doughnut',
          data: data
      });
    }
    else {
      document.getElementById("totalMatches").height = 0;
    }
    $('#TMSBox').dimmer('hide');
    //calendar chart
    if(obj.totalMatches == 0) {
      document.getElementById("cal").height = 0;
    }
    else {
      var calData = [];
      var contained = false;
      for(var i = 0;i < obj.dateData.length;i++) {
        contained = false;
        for(var j = 0;j < calData.length;j++) {
          var d1 = (new Date(calData[j].date));
          var ds1 = d1.getFullYear() + "-" + (d1.getMonth() + 1) + "-" + d1.getDate();
          var d2 = (new Date(obj.dateData[i].date));
          var ds2 = d2.getFullYear() + "-" + (d2.getMonth() + 1)  + "-" + d2.getDate();
          if(ds1 == ds2) {
            calData[j].details.push({
              name: obj.dateData[i].name,
              date: ds2 + " " + d2.getHours() + ":" + d2.getMinutes() + ":" + d2.getSeconds(),
              value: obj.dateData[i].value
            });
            calData[j].total += 150;
            contained = true;
          }
        }
        if(!contained) {
          var d = (new Date(obj.dateData[i].date));
          var ds = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
          calData.push({
            date: ds,
            total: 150,
            details: [{
              name: obj.dateData[i].name,
              date: ds + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds(),
              value: obj.dateData[i].value
            }]
          })
        }
      }
      calendarHeatmap.init(calData, "cal", "#ff3333", "year");

      document.getElementsByClassName("heatmap-tooltip")[0].style.position = "fixed";
      document.getElementById("cal").onmousemove = ((event) => {
        var tooltip = document.getElementsByClassName("heatmap-tooltip")[0];
        tooltip.style.left = event.clientX + "px";
      });
    }
    $('#MatchCalBox').dimmer('hide');
    //team list
    window.setTimeout(() => {
      var queryArr = [];
      for(var i = 0;i < obj.availableTeams.length;i++) {
        queryArr.push(obj.availableTeams[i].team);
      }
      ipcRenderer.on("query-team-reply", (event, message) => {
        var currTeamData = message;
        var tableData = [];
        var listElem = document.getElementById("teamList");
        obj.availableTeams.sort(function(a, b){return  b.totalMatches - a.totalMatches});
        for(var i = 0;i < obj.availableTeams.length;i++) {
          var wasFound = false;
          for(var j = 0;j < currTeamData.length;j++) {
            if(obj.availableTeams[i].team == currTeamData[j].team_number) {
              wasFound = true;
              currTeamData[j].totalMatches = obj.availableTeams[i].totalMatches;
              tableData.push(currTeamData[j]);
            }
          }
          if(!wasFound) {
            tableData.push({
              team_number: obj.availableTeams[i].team,
              totalMatches: obj.availableTeams[i].totalMatches
            });
          }
        }
        var setHeight = document.getElementById("totalMatches").offsetHeight + document.getElementById("totalStat").offsetHeight - 28;
        var table = new Tabulator("#teamList", {
         	height: setHeight,
         	data: tableData,
 	        layout:"fitColumns",
         	columns: [
        	 	{title:"Team Number", field:"team_number", headerFilter:true},
        	 	{title:"Team Name", field:"nickname", headerFilter:true},
        	 	{title:"Total Matches", field:"totalMatches"}
         	],
          pagination:"local",
          paginationSize: 10,
          rowClick: (e, row) => {
            ipcRenderer.sendSync("set-metadata", {targetTeam: row._row.data.team_number});
            ipcRenderer.sendSync("open-url","render/team.html");
          }
        });
        $('#TeamStatBox').dimmer('hide');
      });
      ipcRenderer.send("query-team", {team_number: { $in: queryArr }});
    }, 3000);
  });
  ipcRenderer.send("query-stats");
}

$(document).ready(() => {sync();});
