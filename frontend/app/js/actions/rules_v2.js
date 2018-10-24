import rpc from 'app/rpc'
import {to_mapf} from 'app/utils'

export function rules_v2_list(project){
  return rpc.call("rules_v2.list", {project}).then(payload => ({
    type: "RULES_V2_LIST",
    payload
  }))
}

export function rules_v2_list_clear(){
  return {
    type: "RULES_V2_LIST",
    payload: undefined
  }
}

export function update_trigger_catalog(filter={}){
  return function(dispatch){
    rpc.call("plugin.component.catalog", {type: "trigger"}).then(function(payload){
      dispatch({
        type: "UPDATE_TRIGGER_CATALOG",
        payload: to_mapf(payload, c => c.id)
      })
    })
  }
}
