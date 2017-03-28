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

export function rules_list(project){
  return function(dispatch){
    rpc.call("rules.list",{project: project}).then( (rules) => {
      dispatch({type: "UPDATE_RULES_LIST", project, rules})
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
