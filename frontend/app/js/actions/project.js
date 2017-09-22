import rpc from 'app/rpc'
import Flash from 'app/flash'
import moment from 'moment'
import { push } from 'react-router-redux'

function project_update_all(){
  return function(dispatch){
    rpc.call("project.list",[]).then(function(data){
      dispatch({type: "UPDATE_ALL_PROJECTS", projects: data})
    })
  }
}

function project_add(data){
  return function(dispatch, store){
    rpc.call("project.create",
        [ data.shortname, {name: data.name, tags: data.tags, description: data.description}]
      ).then(function(){
        dispatch( push({pathname: `/project/${data.shortname}/`}) )
        Flash.info(`Added project ${data.name}`)
      })
  }
}

function project_delete(shortname){
  return function(dispatch){
    rpc.call("project.delete", [shortname]).then(function(){
      Flash.info(`Removed project ${shortname}`)
    })
  }
}

function project_update(shortname, changes){
  return function(dispatch){
    rpc.call("project.update", [shortname, changes]).then(function(){
      Flash.info(`Updated project ${shortname}`)
    })
  }
}

function project_attach_service(project_shortname, service_uuid){
  return function(dispatch){
    rpc.call("service.attach",[project_shortname, service_uuid]).then(function(){
      Flash.info("Added service to project")
    })
  }
}

function projects_update_info(project){
  return function(dispatch){
    dispatch({type:"UPDATE_PROJECT_INFO", project, info: undefined})
    if (project){
      rpc.call("project.get", [project]).then( (info) => {
        dispatch({type:"UPDATE_PROJECT_INFO", project, info})
        dispatch( project_get_dashboard(info.dashboards[0].uuid) )
      })
    }
  }
}

function project_update_widget_catalog(){
  return function(dispatch){
    rpc.call("dashboard.widget.catalog", {}).then( (widget_catalog) => {
      dispatch({type:"UPDATE_WIDGET_CATALOG", payload: widget_catalog})
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

function board_set_daterange_start_and_end(start, end){
  return {
    type: "UPDATE_DATERANGE",
    daterange: { start: start, end: end }
  }
}

function board_update_now(end){
  return {
    type: "UPDATE_DATERANGE",
    daterange: { now: moment() }
  }
}

function board_set_realtime(enabled){
  return {
    type: "BOARD_REALTIME",
    payload: enabled
  }
}

function project_get_dashboard(uuid){
  return function(dispatch){
    dispatch({type: "BOARD_SET", payload: undefined })
    if (uuid)
      rpc.call("dashboard.get", {uuid}).then( d => {
        dispatch({type: "BOARD_SET", payload: d})
      })
  }
}

export {
  project_add,
  project_update_all,
  project_delete,
  project_update,
  project_attach_service,
  projects_update_info,
  project_update_widget_catalog,
  project_get_dashboard,
  board_set_daterange_end,
  board_set_daterange_start,
  board_set_daterange_start_and_end,
  board_update_now,
  board_set_realtime
}
