const default_state={
  rules: undefined,
  trigger_catalog: undefined
}

export default function rules(state=default_state, action){
  switch(action.type){
    case "UPDATE_RULES_LIST":
      return $.extend({}, state, {rules: action.rules})
    case "UPDATE_TRIGGER_CATALOG":
      return $.extend({}, state, {trigger_catalog: action.catalog})
    case "CLEAN_RULES_LIST":
      return default_state;
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
      return $.extend({}, state, {rules})
  }
  return state
}
