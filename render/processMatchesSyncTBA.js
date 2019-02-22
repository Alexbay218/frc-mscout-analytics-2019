var syncMatch = () => {
  $('#display').dimmer('show');
  ipcRenderer.send("process-match-tba", {});
  window.setTimeout(() => {$('#display').dimmer('hide');}, 1000);
}
