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
      console.log("Event!")
      const rule=action.rule
      let rules=state.rules.map( (rl) => {
        if (rl.uuid==rule.uuid)
          return rule
        return rl
      })
      return $.extend({}, state, {rules})
  }
  return state
}
