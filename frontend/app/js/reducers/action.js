// Default status, put over current
const default_state={
  actions: [],
}

export function action(state=default_state, action){
  console.log("action action %o", state, action)
  switch(action.type){
    case "ACTION_PS":
      return { actions: action.actions }
      break;
    case "@RPC_EVENT/action.started":
      return { actions: state.actions.concat({
        id: action.id, uuid: action.uuid, name: action.name
      }) }
      break;
    case "@RPC_EVENT/action.stopped":
      return { actions: state.actions.filter( (a) => a.uuid != action.uuid ) }
      break;
  }
  return state
}

export default action
