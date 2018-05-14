import {merge, map_set, map_get} from 'app/utils'
import moment from 'moment'

const DEFAULT_RANGE = 28 * 24 * 60 * 60 // 4W

function previous_daterange(){
  let dr = {}
  const drl = localStorage.daterange
  if (drl)
    dr = JSON.parse(drl)

  const range_s = dr.range_s || DEFAULT_RANGE
  const start = dr.start ? moment(dr.start) : moment().subtract(range_s, "seconds")
  dr = {
    start,
    end: dr.end ? moment(dr.end) : moment(),
    prev: moment(dr.start).subtract(range_s, "seconds"),
    now: moment(),
    range_s,
    rt: +new Date()
  }

  return dr
}


function fix_daterange_constraints(daterange){
  let range_s = daterange.range_s
  if (range_s<300){
    range_s = 300
    daterange.start=moment(daterange.end).subtract(300, "seconds")
  }
  if (range_s > (2 * 24 * 60 * 60)){ // More than 2 days, use full days
    daterange.start = moment(daterange.start).set({hour: 0, minute: 0, second: 0, millisecond: 0}).add(1, "day")
    daterange.end = moment(daterange.end).set({hour: 23, minute: 59, second: 59, millisecond: 999})
  }
  daterange.range_s = daterange.end.diff(daterange.start, "seconds")
  daterange.prev = moment(daterange.start).subtract(range_s, "seconds")
  daterange.now = moment()
  daterange.rt = daterange.rt && (+new Date())
  localStorage.daterange = JSON.stringify({
      start: daterange.start.format(),
      end: daterange.end.format(),
      rt: daterange.rt,
      range_s
  })
  // console.log("Final daterange", daterange)
  return daterange
}


const default_state={
  projects: undefined,
  current: undefined,
  project: undefined,
  catalog: undefined,
  widget_catalog: undefined,
  external_urls: undefined,
  daterange: previous_daterange(),
  dashboard:{
    list: [],
    current: undefined
  },
  issues: {
    new: false,
    timestamp: undefined
  }
}

function project(state=default_state, action){
  switch(action.type){
    case '@@router/LOCATION_CHANGE':
    {
      const match = action.payload.pathname.match(RegExp("^/project/([^/]*)/.*"))
      if (match){
        let current=match[1]
        if (current!=state.current)
          return merge(state, {current, project: undefined} )
        }
      return state
    }
    case 'PROJECT_SET_CURRENT':
      return merge(state, {current: action.payload} )
    case 'UPDATE_ALL_PROJECTS':
      return merge(state, {projects: action.projects} )
    case 'UPDATE_PROJECT_SERVICES':
      return merge(state, {current_services: action.services} )
    case '@RPC_EVENT/project.created':
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
    case 'UPDATE_WIDGET_CATALOG':
      const widget_catalog=action.payload
      return merge(state, {widget_catalog})
    case "@RPC_EVENT/dashboard.widget.created":
    {
      let widgets = map_get(state,["dashboard","current","widgets"])
      return map_set(state, ["dashboard","current","widgets"], widgets.concat(action))
    }
    case "@RPC_EVENT/dashboard.widget.updated":
    {
      let widgets = map_get(state,["dashboard","current","widgets"]) || []
      widgets = widgets.map( (w) => {
        if (w.uuid==action.uuid){
          if (action.config)
            w = merge(w, {config: action.config})
          if (action.ui)
            w = merge(w, {ui: action.ui})
        }
        return w
      })
      return map_set(state, ["dashboard","current","widgets"], widgets)
    }
    case "@RPC_EVENT/dashboard.widget.removed":
    {
      let widgets = map_get(state,["dashboard","current","widgets"])
      widgets = widgets.filter( w => w.uuid != action.uuid )
      return map_set(state, ["dashboard","current","widgets"], widgets)
    }
    case "UPDATE_PROJECT_INFO":
      if (action.project == state.current){
        let ret = merge(state, {project: action.info})
        ret = map_set(ret, ["dashboard", "list"], action.info && action.info.dashboards || [] )
        return ret
      }
      return state
    case "UPDATE_DATERANGE":
    {
      if (action.daterange.start || action.daterange.end){
        let daterange = merge(state.daterange, action.daterange)
        daterange.range_s = daterange.end.diff(daterange.start, "seconds")

        fix_daterange_constraints(daterange)
        // console.log(daterange)
        let rt = false
        if (daterange.rt)
          rt = (+ new Date())
        state = merge(state, {daterange})
      }

      if (action.daterange.rt != undefined){
        let daterange = {...state.daterange}
        daterange.rt = action.daterange.rt && (+new Date())
        state = merge(state, {daterange})
      }

      if (action.daterange.now){
        console.log("Update now", state.daterange)
        state = merge(state, {...state.daterange, now: action.daterange.now})
        if (state.daterange.rt){
          let end = moment()
          const secs = state.daterange.range_s
          let start = moment(end).subtract(secs, "seconds")
          let prev = moment(start).subtract(secs, "seconds")

          const daterange = {
            rt: action.daterange.rt,
            ...state.daterange,
            start: start,
            end: end,
          }

          fix_daterange_constraints(daterange)
          state = merge(state, {daterange})
        }
      }
      return state
    }
    case "UPDATE_EXTERNAL_URL_COMPONENTS":
      return merge(state, {external_urls: action.components})
    case "BOARD_LIST":
      return map_set(state, ["dashboard", "list"], action.payload)
    case "@RPC_EVENT/dashboard.created":
    {
      let list = map_get(state, ["dashboard", "list"])
      return map_set(state, ["dashboard", "list"], list.concat(action))
    }
    case "@RPC_EVENT/dashboard.updated":
    {
      const payload = {
        uuid: action.uuid,
        name: action.name,
        order: action.order,
        config: action.config
      }
      // console.log(action, payload, state.dashboard)
      if (payload.uuid == state.dashboard.current.uuid){
        state = map_set(state, ["dashboard","current"], {...state.dashboard.current, ...payload})
      }
      const list = state.dashboard.list.map( d => {
        if (d.uuid == payload.uuid)
          return {...d, ...payload}
        return d
      })
      return map_set(state, ["dashboard", "list"], list)
    }
    case "@RPC_EVENT/dashboard.removed":
    {
      const list = state.dashboard.list.filter( d => d.uuid != action.uuid)
      return map_set(state, ["dashboard", "list"], list)
    }
    case "BOARD_SET":
      return map_set(state, ["dashboard", "current"], action.payload)
    case "ISSUES_COUNT_PROJECT":
      return merge(state, {issues: {
        new: action.payload.count > 0,
        timestamp: action.payload.timestamp
      } } )
    case "@RPC_EVENT/issue.updated":
    case "@RPC_EVENT/issue.created":
      if (action.issue.aliases.includes(`project/${ state.current }`)){
        const now = (new Date()).toISOString()
        return merge(state, {issues: {
          timestamp: now,
          new: true,
        } } )
      }
  }
  return state
}

export default project
