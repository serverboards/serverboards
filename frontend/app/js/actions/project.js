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
    rpc.call("project.add",
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

function projects_widget_list(project){
  return function(dispatch){
    dispatch({type:"UPDATE_PROJECT_WIDGETS", project, widgets: undefined})
    if (project)
      rpc.call("dashboard.widget.list", [project]).then((widgets) => {
        dispatch({type:"UPDATE_PROJECT_WIDGETS", project, widgets})
      })
  }
}

function projects_update_info(project){
  return function(dispatch){
    dispatch({type:"UPDATE_PROJECT_INFO", project, info: undefined})
    if (project){
      rpc.call("project.get", [project]).then( (info) => {
        dispatch({type:"UPDATE_PROJECT_INFO", project, info})
      })
    }
  }
}

function project_update_widget_catalog(project){
  return function(dispatch){
    dispatch({type:"UPDATE_WIDGET_CATALOG", project, widget_catalog: undefined})
    if (project)
      rpc.call("dashboard.widget.catalog", [project]).then( (widget_catalog) => {
        dispatch({type:"UPDATE_WIDGET_CATALOG", project, widget_catalog})
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
  project_add,
  project_update_all,
  project_delete,
  project_update,
  project_attach_service,
  projects_widget_list,
  projects_update_info,
  project_update_widget_catalog,
  board_set_daterange_end,
  board_set_daterange_start,
  board_update_now
}
