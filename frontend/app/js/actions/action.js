import rpc from 'app/rpc'

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
      let payload = {}
      for(let i of catalog_list){
        payload[i.id] = i
      }
      dispatch({type: "ACTION_CATALOG", payload})
    }).catch(console.error)
  }
}
