import {merge} from 'app/utils'

const default_state = {
  new_issues_timestamp: undefined,
  new_issues: false,
}

export function issues(state=default_state, action){
  switch(action.type){
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
