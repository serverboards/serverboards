// Default status, put over current
const default_state={
  actions: [],
  catalog: []
}

export function action(state=default_state, action){
  switch(action.type){
    case "ACTION_PS":
      return { actions: action.actions }
      break;
    case "@RPC_EVENT/action.started":
      return $.extend({}, state, { actions: state.actions.concat({
        id: action.id, uuid: action.uuid, name: action.name
      }) })
      break;
    case "@RPC_EVENT/action.stopped":
      return $.extend({}, state, { actions: state.actions.filter( (a) => a.uuid != action.uuid ) })
      break;
    case "ACTION_CATALOG":
      return $.extend({}, state, {catalog: action.catalog})
  }
  return state
}

export default action
