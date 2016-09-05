const default_state={
  status: "UNKNOWN",
  extra: undefined
}

function rpc(state=default_state, action){
  if (action.type=="RPC_STATUS"){
    return { status: action.status, extra: action.extra }
  }
  return state
}

export default rpc
