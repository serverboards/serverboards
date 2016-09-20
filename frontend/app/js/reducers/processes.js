const default_state={
  processes: undefined
}
export default function(state=default_state, action){
  switch(action.type){
    case "PROCESS_LIST":
      return { processes: action.list}
      break;
    case "PROCESS_CURRENT":
      console.log(action)
      return { processes: [action.process] }
      break;
    case "@RPC_EVENT/action.started":
      {
        let clean_action={
          uuid: action.uuid,
          id: action.id,
          action: action.name,
          params: action.params,
          user: action.user,
          date: "Just now",
          status: "running"
        }

        if (state.processes == undefined)
          return { processes: [clean_action] }
        return { processes: [clean_action].concat( state.processes )}
      }
      break;
    case "@RPC_EVENT/action.stopped":
      {
        try{
          return { processes: state.processes.map( (p) => {
            if (p.uuid==action.uuid){
              let clean_action = $.extend( {},
                p,
                {status: action.status, elapsed: action.elapsed, result: action.result}
              )
              return clean_action
            }
            return p
          })}
        }
        catch(e){
          console.warn("May fail here for very short lived actions: it may not have proper uuid assigned")
          console.error(e)
        }
      }
      break;
  }
  return state
}
