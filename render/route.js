var Chart = require('chart.js');
var ipcRenderer = require('electron').ipcRenderer;
var Tabulator = require('tabulator-tables');
var countryList = require('country-list');
countryList.overwrite([{code: 'US',name: 'USA'}]);

var router = {
  dashboard: () => {ipcRenderer.sendSync("open-url","render/dashboard.html");},
  processMatches: () => {ipcRenderer.sendSync("open-url","render/processMatches.html");},
  teams: () => {ipcRenderer.sendSync("open-url","render/teams.html");},
  export: () => {ipcRenderer.sendSync("open-url","render/export.html");}
};

var sidebarElement = document.getElementById("sidebar");
sidebarElement.insertAdjacentHTML("beforeend","<a href=\"#\" onclick=\"router.dashboard()\" class=\"item\"><i class=\"desktop icon\"></i>Dashboard</a>");
sidebarElement.insertAdjacentHTML("beforeend","<a href=\"#\" onclick=\"router.processMatches()\" class=\"item\"><i class=\"folder open icon\"></i>Load Data</a>");
sidebarElement.insertAdjacentHTML("beforeend","<a href=\"#\" onclick=\"router.teams()\" class=\"item\"><i class=\"id badge outline icon\"></i>Teams</a>");
sidebarElement.insertAdjacentHTML("beforeend","<a href=\"#\" onclick=\"router.dashboard()\" class=\"active grey item\"><i class=\"flag checkered icon\"></i>Matches</a>");
sidebarElement.insertAdjacentHTML("beforeend","<a href=\"#\" onclick=\"router.dashboard()\" class=\"active grey item\"><i class=\"th list icon\"></i>Rankings</a>");
sidebarElement.insertAdjacentHTML("beforeend","<a href=\"#\" onclick=\"router.export()\" class=\"item\"><i class=\"table icon\"></i>Export CSV</a>");
sidebarElement.insertAdjacentHTML("beforeend","<a href=\"#\" onclick=\"router.dashboard()\" class=\"active grey item\"><i class=\"terminal icon\"></i>Console</a>");
