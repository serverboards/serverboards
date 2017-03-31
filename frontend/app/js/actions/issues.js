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