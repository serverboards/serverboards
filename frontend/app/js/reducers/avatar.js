import {merge} from 'app/utils'

const default_state={}

export function avatar(state=default_state, action){
  switch(action.type){
    case "AVATAR_SET":
    {
      let ns={}
      ns[action.payload.email]=action.payload.avatar
      return merge(state, ns)
    }
  }
  return state
}

export default avatar
