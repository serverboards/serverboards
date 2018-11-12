import rpc from 'app/rpc'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'

export function services_update_catalog(){
  return function(dispatch){
    rpc.call("plugin.component.catalog",{type: "service"}).then(function(catalog_list){
      let payload = {}
      for(let i of catalog_list){
        payload[i.id] = i
      }
      dispatch({
        type: "UPDATE_SERVICE_CATALOG",
        payload
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
      Flash.success(i18n("*{name}* updated", {name: data.name}))
    })
  }
}

export function service_attach(project_shortname, service_uuid){
  return function(dispatch){
    rpc.call("service.attach",[project_shortname, service_uuid]).then(function(){
      Flash.success(i18n("Service attached to project"))
    })
  }
}

export function service_detach(project_shortname, service_uuid){
  return function(dispatch){
    rpc.call("service.detach",[project_shortname, service_uuid]).then(function(){
      Flash.success(i18n("Service detached from project"))
    })
  }
}

export function service_add(sbds, service){
  return function(dispatch){
    rpc.call("service.create", service).then(function(service_uuid){
      if (sbds){
        rpc.call("service.attach",[sbds, service_uuid]).then(function(){
          Flash.success(i18n("Added service and attached to project"))
        })
      }
      else{
        Flash.warning(i18n("Added DETACHED service"))
      }
    })
  }
}

export function service_remove(service){
  return function(dispatch){
    rpc.call("service.delete", [service]).then(() => {
      Flash.success(i18n("Removed service from Serverboards"))
    }).catch(Flash.error)
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
      .catch( e => {
        console.error("Error loading service", e)
        dispatch({ type: "SERVICE_SET_CURRENT", payload: 'error' })
      })
  }
}
