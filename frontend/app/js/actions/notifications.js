import rpc from 'app/rpc'
import Flash from 'app/flash'
import store from 'app/utils/store'

export function notifications_update_catalog(){
  return function(dispatch){
    dispatch({
      type:"UPDATE_NOTIFICATIONS_CATALOG",
      catalog: undefined
    })
    rpc.call("notifications.catalog",[]).then(function(catalog){
      dispatch({
        type:"UPDATE_NOTIFICATIONS_CATALOG",
        catalog: catalog
      })
    })
  }
}
export function notifications_config(){
  let email = store.getState().auth.user.email
  return function(dispatch){
    dispatch({
      type:"UPDATE_NOTIFICATIONS_CONFIG",
      config: undefined
    })
    rpc.call("notifications.config.get",[email]).then(function(config){
      dispatch({
        type:"UPDATE_NOTIFICATIONS_CONFIG",
        config: config
      })
    })
  }
}

export function notifications_update(data){
  let email = store.getState().auth.user.email
  return function(dispatch){
    Flash.info("Updating notification channels")
    let promises=[]
    //console.log("not %o", data.notifications)

    for(let k in data.notifications){
      let v = data.notifications[k]
      console.log(v)
      if (!v)
        continue
      promises.push(
        rpc.call("notifications.config.update", {
          email: email,
          channel: k,
          config: v.config,
          is_active: v.is_active,
        })
      )
    }

    Promise.all( promises ).then(() => {
      Flash.info("Updated successfully")
    }).catch(() => {
      Flash.error("Error updating notifications")
    })
  }
}

export function notifications_unread(data){
  return function(dispatch){
    rpc.call("notifications.list",{tags:["unread"]}).then( (unread) => {
      dispatch({type: "UPDATE_NOTIFICATIONS_UNREAD", unread})
    })
  }
}
