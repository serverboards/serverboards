import rpc from '../rpc'
import Flash from '../flash'

export function services_update_catalog(){
  return function(dispatch){
    rpc.call("service.available",[]).then(function(services){
      dispatch({
        type:"UPDATE_SERVICES",
        services: services
      })
    })
  }
}

export function services_update_all(){
  return function(dispatch){
    rpc.call("service.list",[]).then(function(services){
      dispatch({
        type:"UPDATE_ALL_SERVICES",
        services: services
      })
    })
  }
}

export function service_update(uuid, data){
  return function(dispatch){
    rpc.call("service.update", [uuid, data]).then(() => {
      Flash.info("Service updated")
    })
  }
}
