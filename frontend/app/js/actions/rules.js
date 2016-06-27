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
  return function(dispatch){
    rpc.call("rules.list",{serverboard: serverboard}).then( (rules) => {
      dispatch({type: "UPDATE_RULES_LIST", serverboard, rules})
    })
  }
}

export function rules_list_clean(){
  return {type: "CLEAN_RULES_LIST"}
}
