var filterMatchesObj = {};
var filterMatches = (elemIdStr, callbackStr, showTeam = true) => {
  var mainElem = document.getElementById(elemIdStr);
  mainElem.innerHTML = "";
  mainElem.insertAdjacentHTML("beforeend", "<div class=\"two fields\" id=\"filterDates\"></div>");
  var elem = document.getElementById("filterDates");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field calendar\" id=\"filterStartDate\">" +
    "<div class=\"ui input left icon\">" +
      "<i class=\"calendar icon\"></i>" +
      "<input type=\"text\" placeholder=\"Start Date\">" +
    "</div>" +
  "</div>");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field calendar\" id=\"filterEndDate\">" +
    "<div class=\"ui input left icon\">" +
      "<i class=\"calendar icon\"></i>" +
      "<input type=\"text\" placeholder=\"End Date\">" +
    "</div>" +
  "</div>");
  mainElem.insertAdjacentHTML("beforeend", "<div class=\"inline fields\" id=\"filterMatchType1\"></div>");
  var elem = document.getElementById("filterMatchType1");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui checkbox\" id=\"filterTest\">" +
    "<input type=\"checkbox\" name=\"test\">" +
    "<label>Test Match</label>" +
  "</div></div>");
  $("#filterTest").checkbox("check");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui checkbox\" id=\"filterPracticeField\">" +
    "<input type=\"checkbox\" name=\"practiceField\">" +
    "<label>Practice Field Match</label>" +
  "</div></div>");
  $("#filterPracticeField").checkbox("check");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui checkbox\" id=\"filterPracticeMatch\">" +
    "<input type=\"checkbox\" name=\"practiceMatch\">" +
    "<label>Practice Match</label>" +
  "</div></div>");
  $("#filterPracticeMatch").checkbox("check");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui checkbox\" id=\"filterQualification\">" +
    "<input type=\"checkbox\" name=\"qualification\">" +
    "<label>Qualification Match</label>" +
  "</div></div>");
  $("#filterQualification").checkbox("check");
  mainElem.insertAdjacentHTML("beforeend", "<div class=\"inline fields\" id=\"filterMatchType2\"></div>");
  var elem = document.getElementById("filterMatchType2");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui checkbox\" id=\"filterQuarterfinals\">" +
    "<input type=\"checkbox\" name=\"quarterfinals\">" +
    "<label>Quarterfinals Match</label>" +
  "</div></div>");
  $("#filterQuarterfinals").checkbox("check");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui checkbox\" id=\"filterSemifinals\">" +
    "<input type=\"checkbox\" name=\"semifinals\">" +
    "<label>Semifinals Match</label>" +
  "</div></div>");
  $("#filterSemifinals").checkbox("check");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui checkbox\" id=\"filterFinals\">" +
    "<input type=\"checkbox\" name=\"finals\">" +
    "<label>Finals Match</label>" +
  "</div></div>");
  $("#filterFinals").checkbox("check");
  mainElem.insertAdjacentHTML("beforeend", "<div class=\"inline fields\" id=\"filterTBAData\"></div>");
  var elem = document.getElementById("filterTBAData");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui radio checkbox\" id=\"filterNoTBA\">" +
    "<input type=\"radio\" name=\"tba\">" +
    "<label>No TBA Data</label>" +
  "</div></div>");
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui radio checkbox\" id=\"filterSomeTBA\">" +
    "<input type=\"radio\" name=\"tba\">" +
    "<label>Both</label>" +
  "</div></div>");
  $("#filterSomeTBA").checkbox("check")
  elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui radio checkbox\" id=\"filterOnlyTBA\">" +
    "<input type=\"radio\" name=\"tba\">" +
    "<label>Only TBA Data</label>" +
  "</div></div>");
  if(showTeam) {
    mainElem.insertAdjacentHTML("beforeend", "<div class=\"fields\" id=\"filterTeamSubmit\"></div>");
    var elem = document.getElementById("filterTeamSubmit");
    elem.insertAdjacentHTML("beforeend", "<div class=\"field\"><div class=\"ui search multiple selection dropdown\" id=\"filterTeamDropdown\">" +
      "<div class=\"text\"></div>" +
      "<i class=\"dropdown icon\"></i>" +
    "</div></div>");
    ipcRenderer.once("query-stats-reply", (event, message) => {
      stats = message;
      var teamFilterList = [];
      for(var i = 0;i < stats.availableTeams.length;i++) {
        teamFilterList.push({name: stats.availableTeams[i].team.toString(), value: stats.availableTeams[i].team.toString()});
      }
      $("#filterTeamDropdown").dropdown({placeholder: "Team", values: teamFilterList});
    });
    ipcRenderer.send("query-stats");
  }
  mainElem.insertAdjacentHTML("beforeend", "<div class=\"ui button\" onclick=\"filterMatchesOnClick();" + callbackStr + "\">Filter</div>");
  $("#filterStartDate").calendar();
  $("#filterEndDate").calendar();
}

var filterMatchesOnClick = () => {
  filterMatchesObj = {};
  if($("#filterStartDate").calendar("get date") != null) {
    if(filterMatchesObj.timeStamp == undefined) {filterMatchesObj.timeStamp = {};}
    filterMatchesObj.timeStamp.$gte = $("#filterStartDate").calendar("get date").valueOf();
  }
  if($("#filterEndDate").calendar("get date") != null) {
    if(filterMatchesObj.timeStamp == undefined) {filterMatchesObj.timeStamp = {};}
    filterMatchesObj.timeStamp.$lte = $("#filterEndDate").calendar("get date").valueOf();
  }
  var mtArr = [];
  if($("#filterTest").checkbox("is checked")) {mtArr.push("T");}
  if($("#filterPracticeField").checkbox("is checked")) {mtArr.push("PF");}
  if($("#filterPracticeMatch").checkbox("is checked")) {mtArr.push("PM");}
  if($("#filterQualification").checkbox("is checked")) {mtArr.push("Q");}
  if($("#filterQuarterfinals").checkbox("is checked")) {mtArr.push("QF");}
  if($("#filterSemifinals").checkbox("is checked")) {mtArr.push("SF");}
  if($("#filterFinals").checkbox("is checked")) {mtArr.push("F");}
  if($("#filterNoTBA").checkbox("is checked")) {filterMatchesObj.tbaData = null;}
  if($("#filterOnlyTBA").checkbox("is checked")) {filterMatchesObj.tbaData = {$ne: null};}
  if(mtArr.length > 0) {filterMatchesObj.matchType = {$in: mtArr};}
  if(document.getElementById("filterTeamDropdown") != null) {
    var tArr = $("#filterTeamDropdown").dropdown("get value").split(",");
    for(var i = 0;i < tArr.length;i++) {
      tArr[i] = Number.parseInt(tArr[i]);
    }
    if($("#filterTeamDropdown").dropdown("get value") != "") {filterMatchesObj.targetTeam = {$in: tArr};}
  }
}
