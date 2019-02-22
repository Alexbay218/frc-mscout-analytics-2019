var sync = () => {
  $("#display").transition("fade in", "500ms");
  ipcRenderer.on("process-match-track", (event, arg) => {
    document.getElementById("loadingText").innerText = "Loading [" + (arg.position+1) + "/" + arg.total + "]";
  });
  ipcRenderer.on("process-match-reply", () => {
    router.dashboard();
  });
  ipcRenderer.send("process-match",{});
}

$(document).ready(() => {sync();});
