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
        [ data.shortname, {name: data.name || "", tags: data.tags.split(' ')}]
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
  console.log("Update service %s %o", shortname, changes)
  return function(dispatch){
    rpc.call("service.update", [shortname, changes]).then(function(){
      Flash.info(`Updated service ${shortname}`)
    })
  }
}

export {
  components_update_catalog,
  service_add,
  service_update_all,
  service_delete,
  service_update,
  }
