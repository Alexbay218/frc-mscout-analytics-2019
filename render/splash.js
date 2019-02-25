var sync = () => {
  $("#display").transition("fade in", "500ms");
  ipcRenderer.once("process-match-track", (event, arg) => {
    document.getElementById("loadingText").innerText = "Loading [" + (arg.position+1) + "/" + arg.total + "]";
  });
  ipcRenderer.once("process-match-reply", () => {
    router.dashboard();
  });
  ipcRenderer.send("process-match",{});
}

$(document).ready(() => {sync();});
