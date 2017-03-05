import Flash from 'app/flash'
import rpc from 'app/rpc'
import {set_modal} from 'app/utils/store'
import {i18n} from 'app/utils/i18n'

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
    Flash.error(i18n("Dont know how to trigger this action"))
  }
}
