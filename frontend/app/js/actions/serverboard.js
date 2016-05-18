import rpc from '../rpc'
import Flash from '../flash'

function services_update_catalog(){
  return function(dispatch){
    rpc.call("service.available",[]).then(function(services){
      dispatch({
        type:"UPDATE_SERVICES",
        services: services
      })
    })
  }
}

function services_update_all(){
  return function(dispatch){
    rpc.call("service.list",[]).then(function(services){
      dispatch({
        type:"UPDATE_ALL_SERVICES",
        services: services
      })
    })
  }
}

function serverboard_update_all(){
  return function(dispatch){
    rpc.call("serverboard.list",[]).then(function(data){
      dispatch({type: "UPDATE_ALL_SERVERBOARDS", serverboards: data})
    })
  }
}

function serverboard_add(data){
  return function(dispatch, store){
    rpc.call("serverboard.add",
        [ data.shortname, {name: data.name, tags: data.tags, description: data.description}]
      ).then(function(){
        Flash.info(`Added serverboard ${data.name}`)
      })
  }
}

function serverboard_delete(shortname){
  return function(dispatch){
    rpc.call("serverboard.delete", [shortname]).then(function(){
      Flash.info(`Removed serverboard ${shortname}`)
    })
  }
}

function serverboard_update(shortname, changes){
  return function(dispatch){
    rpc.call("serverboard.update", [shortname, changes]).then(function(){
      Flash.info(`Updated serverboard ${shortname}`)
    })
  }
}

function serverboard_reload_services(shortname){
  return function(dispatch){
    rpc.call("service.list", { serverboard: shortname }).then(function(cs){
      dispatch({
        type: "UPDATE_SERVERBOARD_SERVICES",
        serverboard: shortname,
        services: cs
      })
    })
  }

}

export {
  services_update_catalog,
  serverboard_add,
  serverboard_update_all,
  serverboard_delete,
  serverboard_update,
  serverboard_reload_services,
  services_update_all
  }
