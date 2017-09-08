import {merge} from 'app/utils'

const default_state = {
  issues: undefined,
  filter: ["status:open"],
  real_filter: [],
  new_issues_timestamp: undefined,
  new_issues: false,
}

export function issues(state=default_state, action){
  switch(action.type){
    case "ISSUES_LIST":
      return merge(state, {issues: action.payload.issues })
      break;
    case "ISSUES_FILTER":
      return merge(state, {filter: action.payload.filter, real_filter: action.payload.real_filter})
      break;
    case "ISSUES_COUNT":
      return merge(state, {
        new_issues_timestamp: action.payload.timestamp,
        new_issues: (action.payload.count > 0)
      })
    case "@RPC_EVENT/issue.updated":
    case "@RPC_EVENT/issue.created":
    {
      const now = (new Date()).toISOString()
      return merge(state, {
        new_issues_timestamp: now,
        new_issues: true,
      })
    }
  }
  return state
}

export default issues
