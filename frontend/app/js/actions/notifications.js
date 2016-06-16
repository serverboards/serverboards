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
    rpc.call("notifications.config",[email]).then(function(config){
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
      //console.log("k %o v %o", k, v)
      if (k.endsWith("/active"))
        continue
      promises.push(
        rpc.call("notifications.config_update", {
          email: email,
          channel: k,
          config: v,
          is_active: data.notifications[k+'/active'].is_active})
      )
    }

    Promise.all( promises ).then(() => {
      Flash.info("Updated successfully")
    }).catch(() => {
      Flash.error("Error updating notifications")
    })
  }
}
