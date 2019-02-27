var currFilename = "";
var valList = [];
var editor = CodeMirror.fromTextArea(document.getElementById("mainCode"), {
  lineNumbers: true,
  mode: "javascript"
});

editor.setOption("extraKeys", {
  "Ctrl-S": () => {saveFilePrompt();}
});

var getTeams = (arg) => {
  return ipcRenderer.sendSync("query-team", arg);
};

var getMatches = (arg) => {
  var res = ipcRenderer.sendSync("query", arg);
  for(var i = 0;i < res.length;i++) {
    res[i] = process(res[i]);
  }
  return res;
};

var loadFile = () => {
  if($("#fileList").dropdown("get value") != "") {
    currFilename = $("#fileList").dropdown("get value");
    editor.setValue(ipcRenderer.sendSync("query-console-file", {filename: currFilename})[0].content);
    document.getElementById("codeEditorHeader").innerText = "Code Editor (" + currFilename + ")";
  }
};

var removePrompt = () => {
  if(currFilename != "") {
    ipcRenderer.sendSync("remove-console-file", {filename: currFilename});
    currFilename = "";
    editor.setValue("");
    document.getElementById("codeEditorHeader").innerText = "Code Editor";
    syncValList();
  }
};

var saveFilePrompt = () => {
  if(currFilename == "") {
    saveAsFilePrompt();
  }
  else {
    saveOp(currFilename);
  }
};

var saveAsFilePrompt = () => {
  $("#saveAsModal").modal({
    closable  : false,
    onApprove : () => {
      if(document.getElementById("saveAsText").value != "") {
        saveOp(document.getElementById("saveAsText").value);
      }
    }
  }).modal('show');
}

var saveOp = (inFilename) => {
  var isInValList = false;
  for(var i = 0;i < valList.length;i++) {
    if(valList[i] == inFilename) {isInValList = true;}
  }
  if(!isInValList) {
    ipcRenderer.sendSync("update-console-file", {filename: inFilename, content: editor.getValue()});
    currFilename = inFilename;
    document.getElementById("codeEditorHeader").innerText = "Code Editor (" + currFilename + ")";
  }
  syncValList();
};

var runCode = () => {
  $('#display').dimmer('show');
  window.setTimeout(() => {
    var F = new Function(editor.getValue());
    F();
    $('#display').dimmer('hide');
  }, 50);
};

var syncValList = () => {
  valList = [];
  var ret = ipcRenderer.sendSync("query-console-file",{});
  for(var i = 0;i < ret.length;i++) {
    if(ret[i].filename == currFilename) {
      valList.push({name: ret[i].filename, value: ret[i].filename, selected: true});
    }
    else {
      valList.push({name: ret[i].filename, value: ret[i].filename});
    }
  }
  $("#fileList").dropdown({placeholder: "Filename", values: valList});
};

var clearLog = () => {
  var tmp = document.getElementById("mainLog");
  tmp.innerHTML = "";
  tmp.style.height = "auto";
};

var sync = () => {
  $("#display").transition("fade in", "500ms");
  $('#display').dimmer({closable:false});
  $('#display').dimmer('show');
  var oldLog = console.log;
  console.log = function (message){
      var res = "";
      if(typeof(message) == "object") {res = JSON.stringify(message);}
      else {res = message.toString();}
      var tmp = document.getElementById("mainLog");
      tmp.insertAdjacentHTML("afterbegin", "<div class=\"item\">" + res + "</div>");
      if(tmp.offsetHeight > 1000) {
        tmp.style.height = "1000px";
      }
      oldLog.apply(console, arguments);
  };
  syncValList();
  filterMatches("matchFilter", "");
  window.setTimeout(() => {
    $('#display').dimmer('hide');
  }, 500);
};

$(document).ready(() => {sync();});
