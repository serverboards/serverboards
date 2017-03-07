import {merge} from 'app/utils'
import moment from 'moment'

var default_state={
  projects: [],
  current: undefined,
  project: undefined,
  catalog: undefined,
  widgets: undefined,
  widget_catalog: undefined,
  external_urls: undefined,
  daterange: {
    start: (moment().subtract(7,"days")),
    end: moment(),
    now: moment()
  }
}

function project(state=default_state, action){
  switch(action.type){
    case '@@router/LOCATION_CHANGE':
    {
      let current=action.payload.pathname.replace(RegExp("^/project/([^/]*)/.*"), "$1")
      if (current!=state.current)
        return merge(state, {current, project: undefined} )
      return state
    }
    case 'UPDATE_ALL_PROJECTS':
      return merge(state, {projects: action.projects} )
    case 'UPDATE_PROJECT_SERVICES':
      return merge(state, {current_services: action.services} )
    case '@RPC_EVENT/project.added':
      return merge(state, {projects: state.projects.concat(action.project) } )
    case '@RPC_EVENT/project.deleted':
      return merge(state, {projects: state.projects.filter( s => s.shortname != action.shortname ) } )
    case '@RPC_EVENT/project.updated':
      {
        let projects = state.projects.map( s => {
          if (s.shortname == action.shortname){
            return action.project
          }
          return s
        })
        let project = projects.find( (s) => s.shortname == state.current )

        return merge(state, {projects, project})
      }
    case '@RPC_EVENT/service.updated':
      {
        if (!state.project || !state.project.services)
          return state
        let changed = false
        let current_services = state.project.services.map( s => {
          if (s.uuid == action.service.uuid){
            changed = true
            if (action.service.projects.indexOf(state.current)>=0)
              return action.service
            else
              return undefined
          }
          return s
        }).filter( (s) => s != undefined )
        if (!changed && action.service.projects && action.service.projects.indexOf(state.current)>=0)
          current_services.push(action.service)
        return merge(state, {project: merge(state.project, {services: current_services})})
      }
    case 'UPDATE_PROJECT_WIDGETS':
      const widgets=action.widgets
      return merge(state, {widgets})
    case 'UPDATE_WIDGET_CATALOG':
      const widget_catalog=action.widget_catalog
      return merge(state, {widget_catalog})
    case "@RPC_EVENT/dashboard.widget.added":
      return merge(state, {widgets: state.widgets.concat(action)})
    case "@RPC_EVENT/dashboard.widget.updated":
      return merge(state, {widgets: state.widgets.map( (w) => {
        if (w.uuid==action.uuid && action.config)
          return merge(w, {config: action.config})
        return w
      }) } )
    case "@RPC_EVENT/dashboard.widget.removed":
      return merge(state, {widgets: state.widgets.filter( (w) => (w.uuid != action.uuid ) )} )
    case "UPDATE_PROJECT_INFO":
      if (action.project == state.current)
        return merge(state, {project: action.info})
      return state
    case "UPDATE_DATERANGE":
      return merge(state, {daterange: merge(state.daterange, action.daterange)})
    case "UPDATE_EXTERNAL_URL_COMPONENTS":
      return merge(state, {external_urls: action.components})
  }
  return state
}

export default project
