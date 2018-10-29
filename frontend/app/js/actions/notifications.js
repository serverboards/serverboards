import rpc from 'app/rpc'

export function notifications_unread(data){
  return function(dispatch){
    rpc.call("notifications.list",{tags:["unread"]}).then( (unread) => {
      dispatch({type: "UPDATE_NOTIFICATIONS_UNREAD", unread})
    })
  }
}
