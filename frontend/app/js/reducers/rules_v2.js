import { merge } from 'app/utils'

const default_state={
  rules: undefined,
  trigger_catalog: undefined
}

function rules_v2(state=default_state, action){
  switch(action.type){
    case "RULES_V2_LIST":
      return merge(state, {rules: action.payload})
    case "UPDATE_TRIGGER_CATALOG":
      return {...state, trigger_catalog: action.payload}
    case "@RPC_EVENT/rules_v2.updated":
      if (action.rule.deleted){
        return {...state, rules: state.rules.filter( r => r.uuid != action.rule.uuid )}
      }
      else{
        return {...state, rules: state.rules.map(
          r => r.uuid==action.rule.uuid ? action.rule : r
        )}
      }
    case "@RPC_EVENT/rules_v2.created":
      return {...state, rules: state.rules.concat( action.rule )}
  }
  return state
}

export default rules_v2
