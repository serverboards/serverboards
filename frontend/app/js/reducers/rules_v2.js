import { merge } from 'app/utils'

const default_state={
  rules: undefined,
}

function rules_v2(state=default_state, action){
  if (action.type=="RULES_V2_LIST"){
    return merge(state, {rules: action.payload})
  }
  return state
}

export default rules_v2
