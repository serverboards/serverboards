import rpc from 'app/rpc'
import Flash from 'app/flash'

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

function serverboard_attach_service(serverboard_shortname, service_uuid){
  return function(dispatch){
    rpc.call("service.attach",[serverboard_shortname, service_uuid]).then(function(){
      Flash.info("Added service to serverboard")
    })
  }
}

function serverboards_widget_list(serverboard){
  return function(dispatch){
    rpc.call("serverboard.widget.list", [serverboard]).then((widgets) => {
      dispatch({type:"UPDATE_SERVERBOARD_WIDGETS", serverboard, widgets})
    })
  }
}

function serverboards_update_info(serverboard){
  return function(dispatch){
    dispatch({type:"UPDATE_SERVERBOARD_INFO", serverboard, undefined})
    rpc.call("serverboard.info", [serverboard]).then( (info) => {
      dispatch({type:"UPDATE_SERVERBOARD_INFO", serverboard, info})
    })
  }
}

export {
  serverboard_add,
  serverboard_update_all,
  serverboard_delete,
  serverboard_update,
  serverboard_attach_service,
  serverboards_widget_list,
  serverboards_update_info
  }
