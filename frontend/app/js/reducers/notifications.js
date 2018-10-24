import {merge} from 'app/utils'

// Default status, put over current
const default_state={
  unread: []
}

export function notifications(state=default_state, action){
  switch(action.type){
    case "UPDATE_NOTIFICATIONS_UNREAD":
      return {unread: action.unread}
    case "@RPC_EVENT/notifications.new":
      return {unread: [action.notification].concat(state.unread)}
    case "@RPC_EVENT/notifications.update":
      let updated = false
      let unread = state.unread.map( (u) => {
        if (u.id == action.notification.id){
          updated = true
          return action.notification
        }
        return u
      })
      if (!updated)
        unread = [action.notification].concat(unread)
      unread = unread.filter( (n) => (n.tags.indexOf("new")>=0) )
      return {unread}
  }
  return state
}

export default notifications
