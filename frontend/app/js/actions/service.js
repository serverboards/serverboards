import rpc from 'app/rpc'
import Flash from 'app/flash'

export function services_update_catalog(){
  return function(dispatch){
    rpc.call("service.catalog",[]).then(function(services){
      dispatch({
        type:"UPDATE_SERVICE_CATALOG",
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
      Flash.success("Service updated")
    })
  }
}

export function service_attach(serverboard_shortname, service_uuid){
  return function(dispatch){
    rpc.call("service.attach",[serverboard_shortname, service_uuid]).then(function(){
      Flash.success("Added service to serverboard")
    })
  }
}

export function service_detach(serverboard_shortname, service_uuid){
  return function(dispatch){
    rpc.call("service.detach",[serverboard_shortname, service_uuid]).then(function(){
      Flash.success("Detached service from serverboard")
    })
  }
}

export function service_add(sbds, service){
  return function(dispatch){
    rpc.call("service.create", service).then(function(service_uuid){
      if (sbds){
        rpc.call("service.attach",[sbds, service_uuid]).then(function(){
          Flash.success("Added service and attached to serverboard")
        })
      }
      else{
        Flash.warning("Added DETACHED service")
      }
    })
  }
}

export function update_external_url_components(traits=[]){
  return function(dispatch){
    rpc.call("plugin.component.catalog",{type:"external url", traits})
       .then( (components) => dispatch({type:"UPDATE_EXTERNAL_URL_COMPONENTS", components}))
  }
}
export function clear_external_url_components(){
  return {
    type: "UPDATE_EXTERNAL_URL_COMPONENTS",
    components: undefined
  }
}

export function service_load_external_url_components(traits=[]){
  return function(dispatch){
    rpc.call("plugin.component.catalog",{type:"external url", traits})
       .then( (components) => dispatch({type:"SERVICE_SET_EXTERNAL_URL_COMPONENTS", payload: components}))
  }
}
export function service_clear_external_url_components(){
  return {
    type: "SERVICE_SET_EXTERNAL_URL_COMPONENTS",
    payload: undefined
  }
}


export function service_load_current(uuid){
  if (!uuid){
    return function(dispatch){
      dispatch({type: "SERVICE_SET_CURRENT", payload: null})
      dispatch({type: "SERVICE_SET_CURRENT_SCREENS", payload: null })
    }
  }

  return function(dispatch){
    dispatch({type: "SERVICE_SET_CURRENT", payload: null})
    rpc.call("service.get", [uuid])
      .then( (service) => {
        dispatch({ type: "SERVICE_SET_CURRENT", payload: service })
        return rpc.call("plugin.component.catalog", {type: "screen", traits: service.traits})
      } )
      .then( (screens) => {
        dispatch({ type: "SERVICE_SET_CURRENT_SCREENS", payload: screens })
      } )
  }
}
