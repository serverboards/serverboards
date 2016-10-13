import Flash from 'app/flash'
import rpc from 'app/rpc'
import { push } from 'react-router-redux'
import store from 'app/utils/store'

function set_modal(modal, data={}){
  console.log(modal, data)
  const pathname=store.getState().routing.locationBeforeTransitions.pathname
  store.dispatch( push( {
    pathname: pathname,
    state: { modal, data }
  } ) )
}

export function trigger_action(action, service){
  if (action.extra.call){
    const params = service.config

    let missing_params = action.extra.call.params.filter((p) => !(p.name in params))
    if (missing_params.length==0){
      rpc.call("action.trigger",
        [action.id, params]).then(function(){
        })
    }
    else{
      set_modal("service.action",{ action, params, missing_params })
    }
  }
  else if (action.extra.screen){
    this.context.router.push({
      pathname: `/s/${action.id}`,
      state: { service: service }
    })
  }
  else {
    Flash.error("Dont know how to trigger this action")
  }
}
