var metadata = {};

var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  $('#display').dimmer('show');
  metadata = ipcRenderer.sendSync("get-metadata");
  document.getElementById("navSearch").value = metadata.targetTeam;
  if(metadata.targetTeam != undefined) {
    ipcRenderer.sendSync("set-metadata", {});
    ipcRenderer.once("query-team-reply", (event, docs) => {
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
      teamData();
    });
    ipcRenderer.send("query-team", {team_number: metadata.targetTeam});
    filterMatches("matchFilter", "resetCharts();teamData();", false);
  }
  else {router.teams()}
}

var teamData = () => {
  ipcRenderer.once("query-reply", (e, docs) =>{
    var tableData = docs;
    var comments = [];
    var sumAccuracy = 0;
    var sumScore = 0;
    for(var i = 0;i < tableData.length;i++) {
      tableData[i] = process(tableData[i]);
      var currDate = (new Date(tableData[i].timeStamp));
      var str = (currDate.getMonth() + 1) + "/" + currDate.getDate() + "/" + currDate.getFullYear();
      tableData[i].dateStr = str;
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
        {title: "Date", field: "dateStr", headerFilter: true, sorter:"date", sorterParams:{format:"MM/DD/YYYY"}},
        {title: "Match Type", field: "matchType", headerFilter: true},
        {title: "Match Number", field: "matchNumber", headerFilter: true},
        {title: "Score", field: "score"},
        {title: "Scoring Accuracy", field: "percentage"},
        {title: "Credibility", field: "credibility", headerFilter: true}
      ],
      pagination: "local",
      paginationSize: 5,
      rowClick: (e, row) => {
        ipcRenderer.sendSync("set-metadata", ipcRenderer.sendSync("query-lite", {hash: row._row.data.hash})[0]);
        ipcRenderer.sendSync("open-url","render/match.html");
      }
    });
    table.setSort([
      {column:"matchType", dir:"asc"},
      {column:"matchNumber", dir:"asc"}
    ]);
    document.getElementById("totalMatches").innerText = docs.length;
    document.getElementById("avgAccuracy").innerText = Number.parseFloat(((sumAccuracy/docs.length)*100).toFixed(2));
    document.getElementById("avgScore").innerText = Number.parseFloat((sumScore/docs.length).toFixed(2));
    var commentsListElem = document.getElementById("commentList");
    commentsListElem.innerHTML = "";
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
    addCharts(document.getElementById("displayGrid"), true);
    charts(tableData);
    window.setTimeout(() => {
      $('#display').dimmer('hide');
    }, 500);
  });
  filterMatchesObj.targetTeam = metadata.targetTeam;
  ipcRenderer.send("query", filterMatchesObj);
}

var go = () => {
  $('#display').dimmer('show');
  ipcRenderer.sendSync("set-metadata", {targetTeam: Number.parseInt(document.getElementById("navSearch").value)});
  ipcRenderer.sendSync("open-url","render/team.html");
}

$(document).ready(() => {sync();});
