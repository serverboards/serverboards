import { merge } from 'app/utils'

const default_state={
  rules: undefined,
}

function rules_v2(state=default_state, action){
  switch(action.type){
    case "RULES_V2_LIST":
      return merge(state, {rules: action.payload})
    case "@RPC_EVENT/rules_v2.updated":
      return {...state, rules: state.rules.map(
        r => r.uuid==action.rule.uuid ? action.rule : r
      )}
  }
  return state
}

export default rules_v2
