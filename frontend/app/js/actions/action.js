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
    rpc.call('action.catalog',{}).then(function(catalog){
      dispatch({type: "ACTION_CATALOG", catalog})
    })
  }
}
