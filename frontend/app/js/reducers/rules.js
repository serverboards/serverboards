import {merge} from 'app/utils'

const default_state={
  rules: undefined,
  trigger_catalog: undefined,
  rule: undefined,
}

export default function rules(state=default_state, action){
  switch(action.type){
    case "UPDATE_RULES_LIST":
      return merge(state, {rules: action.rules})
    case "UPDATE_TRIGGER_CATALOG":
      return merge(state, {trigger_catalog: action.catalog})
    case "CLEAN_RULES_LIST":
      return default_state;
    case "CURRENT_RULE":
      return merge(state, {rule: action.payload})
    case "@RPC_EVENT/rules.update":
      // There should only arrive rules on current serverboard, as per subscription.
      const rule=action.rule
      let updated=false
      let rules=state.rules.map( (rl) => {
        if (rl.uuid==rule.uuid){
          updated=true
          return rule
        }
        return rl
      })
      if (!updated)
        rules=rules.concat([rule])
      return merge(state, {rules})
  }
  return state
}
