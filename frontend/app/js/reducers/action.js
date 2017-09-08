import {merge} from 'app/utils'

// Default status, put over current
const default_state={
  actions: [],
  catalog: []
}

export function action(state=default_state, action){
  switch(action.type){
    case "ACTION_PS":
      return merge(state, { actions: action.actions })
      break;
    case "@RPC_EVENT/action.started":
      return merge(state, { actions: state.actions.concat({
        id: action.id, uuid: action.uuid, name: action.name, progress: action.progress, label: action.label
      }) })
      break;
    case "@RPC_EVENT/action.stopped":
      return merge(state, { actions: state.actions.filter( (a) => a.uuid != action.uuid ) })
      break;
    case "@RPC_EVENT/action.updated":
      return merge(state, {actions: state.actions.map( (a) => {
        if (a.uuid == action.uuid){
          let ret = merge(a, {})
          if (action.progress)
            ret.progress=action.progress
          if (action.label)
            ret.label=action.label
          return ret
        }
        return a
      })})
      break;
    case "ACTION_CATALOG":
      return merge(state, {catalog: action.catalog})
  }
  return state
}

export default action
