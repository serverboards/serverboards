import rpc from '../rpc'
import Flash from '../flash'

function components_update_catalog(){
  return function(dispatch){
    rpc.call("component.available",[]).then(function(components){
      dispatch({
        type:"UPDATE_COMPONENTS",
        components: components
      })
    })
  }
}

function service_update_all(){
  return function(dispatch){
    rpc.call("service.list",[]).then(function(data){
      dispatch({type: "UPDATE_ALL_SERVICES", services: data})
    })
  }
}

function service_add(data){
  return function(dispatch, store){
    rpc.call("service.add",
        [ data.shortname, {name: data.name, tags: data.tags, description: data.description}]
      ).then(function(){
        Flash.info(`Added service ${data.name}`)
      })
  }
}

function service_delete(shortname){
  return function(dispatch){
    rpc.call("service.delete", [shortname]).then(function(){
      Flash.info(`Removed service ${shortname}`)
    })
  }
}

function service_update(shortname, changes){
  return function(dispatch){
    rpc.call("service.update", [shortname, changes]).then(function(){
      Flash.info(`Updated service ${shortname}`)
    })
  }
}

function service_reload_components(shortname){
  return function(dispatch){
    rpc.call("component.list", { service: shortname }).then(function(cs){
      dispatch({
        type: "UPDATE_SERVICE_COMPONENTS",
        service: shortname,
        components: cs
      })
    })
  }

}

export {
  components_update_catalog,
  service_add,
  service_update_all,
  service_delete,
  service_update,
  service_reload_components
  }
