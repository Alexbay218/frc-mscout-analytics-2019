var metadata = {};
var data = {};
var connectedData = [];

var init = () => {
  document.getElementById("titleText").innerText = "";
  var str = "";
  if(metadata.matchType == "T") {str = "Test Match Number ";}
  if(metadata.matchType == "PF") {str = "Practice Field Match Number ";}
  if(metadata.matchType == "PM") {str = "Practice Match Number ";}
  if(metadata.matchType == "Q") {str = "Qualification Match Number ";}
  if(metadata.matchType == "QF") {str = "Quarterfinal Match Number ";}
  if(metadata.matchType == "SF") {str = "Semifinal Match Number ";}
  if(metadata.matchType == "F") {str = "Final Match Number ";}
  str += metadata.matchNumber;
  document.getElementById("titleText").innerText = str;
  document.getElementById("titleComment").innerText = metadata.comments;
  getTeam();
  getData();
  $('#display').dimmer('hide');
}

var getData = () => {
  ipcRenderer.once("query-reply", (event, docs) => {
    addCharts(document.getElementById("displayGrid"));
    data = process(docs[0]);
    charts([data]);
  });
  ipcRenderer.send("query", {hash: metadata.hash});
}

var getTeam = () => {
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
  });
  ipcRenderer.send("query-team", {team_number: metadata.targetTeam});
}

var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  $('#display').dimmer('show');
  metadata = ipcRenderer.sendSync("get-metadata");
  if(metadata != {}) {
    ipcRenderer.sendSync("set-metadata", {});
    console.log(metadata);
    init();
  }
  else {
    router.matches();
  }
}

$(document).ready(() => {sync();});
