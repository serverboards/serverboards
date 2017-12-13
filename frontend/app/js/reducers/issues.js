import {merge} from 'app/utils'

const default_state = {
  timestamp: "1970-01-01",
  new_issues: false,
}

export function issues(state=default_state, action){
  switch(action.type){
    case "ISSUES_COUNT":
      if (action.payload.timestamp > state.timestamp){
        return merge(state, {
          timestamp: action.payload.timestamp,
          new_issues: (action.payload.count > 0)
        })
      }
    break;
    case "@RPC_EVENT/issue.updated":
    case "@RPC_EVENT/issue.created":
    {
      const now = (new Date()).toISOString()
      return merge(state, {
        timestamp: now,
        new_issues: true,
      })
    }
    break;
  }
  return state
}

export default issues
