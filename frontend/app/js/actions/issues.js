import rpc from 'app/rpc'
import store from 'app/utils/store'
import { object_is_equal } from 'app/utils'

export function load_issues(filter){
  return function(dispatch){
    // Do not ask by status, I manage it somehow else
    const real_filter = {}
    filter.filter( f => !f.startsWith("status:") ).map( f => {
      if (f.startsWith('project:')){
        real_filter["alias"]=`project/${f.slice(8,1000)}`
      }
    })
    const issues = store.getState().issues
    dispatch({type: "ISSUES_FILTER", payload: { filter, real_filter }})

    // Only full reload if real filter changes.
    if (issues.issues && object_is_equal(issues.real_filter, real_filter)){
      return;
    }

    dispatch({type: "ISSUES_LIST", payload: {issues: undefined}})
    rpc.call("issues.list", real_filter).then( issues => {
      dispatch({type: "ISSUES_LIST", payload: { issues }})
    })
  }
}

export function clear_issues(){
  return function(dispatch){
    dispatch({type: "ISSUES_FILTER", payload: { real_filter: [], filter: ["status:open"] }})
    dispatch({type: "ISSUES_LIST", payload: {issues: undefined}})
  }
}

export function get_issues_count_since(timestamp){
  return rpc
    .call("issues.list", {"return": "count", since: timestamp})
    .then( i => ({
      type: "ISSUES_COUNT",
      payload: {
        count: i,
        timestamp: timestamp
      }
    }))
}

export function clear_issues_count(){
  const timestamp = (new Date()).toISOString()
  localStorage.issues_check_timestamp = timestamp

  return {
    type: "ISSUES_COUNT",
    payload:{
      count: 0,
      timestamp: timestamp
    }
  }
}


export function get_issues_count_at_project_since(project, timestamp){
  console.log("Get issues count %o %o", project, timestamp)
  return rpc
    .call("issues.list", {"return": "count", project, since: timestamp})
    .then( i => ({
      type: "ISSUES_COUNT_PROJECT",
      payload: {
        project,
        count: i,
        timestamp: timestamp
      },
      _: console.log("Got %o issues at project %o since %o", i, project, timestamp)
    }))
}

export function clear_issues_count_at_project(project){
  const timestamp = (new Date()).toISOString()
  localStorage[`issues_${project}`]=timestamp

  return {
    type: "ISSUES_COUNT_PROJECT",
    payload:{
      count: 0,
      timestamp: timestamp
    }
  }
}
