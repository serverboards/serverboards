import rpc from 'app/rpc'
import Flash from 'app/flash'

export function update_trigger_catalog(filter={}){
  return function(dispatch){
    rpc.call("rules.catalog", {}).then(function(catalog){
      dispatch({type: "UPDATE_TRIGGER_CATALOG", catalog })
    })
  }
}

export function rules_list(serverboard){
  console.log("Get rules list for %o", serverboard)
  return function(dispatch){
    console.log("2. Get rules list for %o", serverboard)
    rpc.call("rules.list",{serverboard: serverboard}).then( (rules) => {
      console.log("Got rules list for %o: %o", serverboard, rules)
      dispatch({type: "UPDATE_RULES_LIST", serverboard, rules})
    })
  }
}

export function rules_list_clean(){
  return {type: "CLEAN_RULES_LIST"}
}
