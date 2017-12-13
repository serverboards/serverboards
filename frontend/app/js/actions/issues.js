import rpc from 'app/rpc'
import store from 'app/utils/store'
import { object_is_equal } from 'app/utils'

export function get_issues_count_since(timestamp){
  return rpc
    .call("issues.list", {"return": "count", since: timestamp})
    .then( ({count, timestamp}) => {
      return {
        type: "ISSUES_COUNT",
        payload: {
          count,
          timestamp
        }
      }
    })
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
