import rpc from 'app/rpc'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'

export function update_trigger_catalog(filter={}){
  return function(dispatch){
    rpc.call("rules.catalog", {}).then(function(catalog){
      dispatch({type: "UPDATE_TRIGGER_CATALOG", catalog })
    })
  }
}

export function rules_list(filter){
  return function(dispatch){
    rpc.call("rules.list",filter).then( (rules) => {
      dispatch({type: "UPDATE_RULES_LIST", payload: rules})
    }).catch( (e) => {
      console.error("Error getting rules: %o", e)
    })
  }
}

export function rules_list_clean(){
  return {type: "CLEAN_RULES_LIST"}
}

export function rules_save(rule){
  return function(dispatch){
    rpc.call("rules.update", rule).then(() => {
      Flash.success(i18n("Rule *{rule}* updated", {rule: rule.name}))
    })
  }
}

export function rules_delete(rule){
  return function(dispatch){
    rpc.call("rules.delete", [rule]).then(() => {
      Flash.success(i18n("Rule deleted"))
    })
  }
}

export function get_rule(uuid){
  return function(dispatch){
    rpc.call("rules.get", [uuid]).then( (rule) => {
      dispatch({type:"CURRENT_RULE", payload: rule })
    })
  }
}

export function clean_rule(){
  return {
    type: "CURRENT_RULE",
    payload: undefined
  }
}

const empty_rule={
  uuid: undefined,
  id: undefined,
  service: undefined,
  trigger: {
    trigger: undefined,
    params: {}
  },
  actions: {}
}

export function set_empty_rule(){
  return {
    type: "CURRENT_RULE",
    payload: empty_rule
  }
}
