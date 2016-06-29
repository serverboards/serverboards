const default_state={
  lines: [{text: '*** Serverboards console ***', highlight: "comment", id: 1}],
  show: false
}

var maxid=10

export const _console = (state = default_state , action) => {
  let nstate=Object.assign({}, state) // copy state
  switch(action.type){
    case "CONSOLE_CALL":
      maxid+=1
      nstate.lines=nstate.lines.concat({text: ">>> "+action.text, highlight: "call", id: maxid} )
      break;
    case "CONSOLE_RESPONSE":
      maxid+=1
      nstate.lines=nstate.lines.concat({text: JSON.stringify(action.result, null, ' '), highlight: "result", id: maxid} )
      break;
    case "CONSOLE_ERROR":
      maxid+=1
      nstate.lines=nstate.lines.concat({text: JSON.stringify(action.error), highlight: "error", id: maxid} )
      break;
    case "CONSOLE_SHOW":
      nstate.show=true
      break
    case "CONSOLE_HIDE":
      nstate.show=false
      break
  }
  return nstate
}

export default _console
