import rpc from 'app/rpc'
import {to_mapf} from 'app/utils'

export function action_ps(){
  return function(dispatch){
    rpc.call('action.ps',[]).then(function(list){
      dispatch({type: "ACTION_PS", actions: list})
    })
  }
}

export function action_catalog(){
  return function(dispatch){
    rpc.call('plugin.component.catalog',{type: "action"}).then(function(catalog_list){
      const payload = to_mapf(catalog_list, c => c.id)
      dispatch({type: "ACTION_CATALOG", payload})
    }).catch(console.error)
  }
}
