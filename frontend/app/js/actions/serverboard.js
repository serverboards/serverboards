import rpc from 'app/rpc'
import Flash from 'app/flash'
import moment from 'moment'
import { push } from 'react-router-redux'

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
        dispatch( push({pathname: `/serverboard/${data.shortname}/`}) )
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
    dispatch({type:"UPDATE_SERVERBOARD_WIDGETS", serverboard, widgets: undefined})
    if (serverboard)
      rpc.call("serverboard.widget.list", [serverboard]).then((widgets) => {
        dispatch({type:"UPDATE_SERVERBOARD_WIDGETS", serverboard, widgets})
      })
  }
}

function serverboards_update_info(serverboard){
  return function(dispatch){
    dispatch({type:"UPDATE_SERVERBOARD_INFO", serverboard, info: undefined})
    if (serverboard){
      rpc.call("serverboard.info", [serverboard]).then( (info) => {
        dispatch({type:"UPDATE_SERVERBOARD_INFO", serverboard, info})
      })
    }
  }
}

function serverboard_update_widget_catalog(serverboard){
  return function(dispatch){
    dispatch({type:"UPDATE_WIDGET_CATALOG", serverboard, widget_catalog: undefined})
    if (serverboard)
      rpc.call("serverboard.widget.catalog", [serverboard]).then( (widget_catalog) => {
        dispatch({type:"UPDATE_WIDGET_CATALOG", serverboard, widget_catalog})
      })
  }
}

function board_set_daterange_start(start){
  return {
    type: "UPDATE_DATERANGE",
    daterange: { start: start }
  }
}

function board_set_daterange_end(end){
  return {
    type: "UPDATE_DATERANGE",
    daterange: { end: end }
  }
}

function board_update_now(end){
  return {
    type: "UPDATE_DATERANGE",
    daterange: { now: moment() }
  }
}

export {
  serverboard_add,
  serverboard_update_all,
  serverboard_delete,
  serverboard_update,
  serverboard_attach_service,
  serverboards_widget_list,
  serverboards_update_info,
  serverboard_update_widget_catalog,
  board_set_daterange_end,
  board_set_daterange_start,
  board_update_now
}
