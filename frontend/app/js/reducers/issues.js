import {merge} from 'app/utils'

const default_state = {
  issues: undefined,
  filter: ["status:open"],
  real_filter: []
}

export function issues(state=default_state, action){
  switch(action.type){
    case "ISSUES_LIST":
      return merge(state, {issues: action.payload.issues })
      break;
    case "ISSUES_FILTER":
      return merge(state, {filter: action.payload.filter, real_filter: action.payload.real_filter})
      break;
  }
  return state
}

export default issues
