import {merge} from 'app/utils'

// Default status, put over current
const default_state={
  catalog: undefined,
  config: undefined,
  catalog_with_config: undefined,
  unread: []
}

function fill_catalog(catalog, config){
  if (!catalog || !config)
    return undefined
  let newcatalog = catalog.map( (cat) => {
    let channel_config = config[cat.channel] || {}
    let fields = cat.fields.map( (f) => {
      let conf=channel_config.config || {}
      return $.extend({}, f, {value: conf[f.name]})
    })
    let ret= $.extend({}, cat, {fields: fields, is_active: channel_config.is_active})
    return ret
  })
  return newcatalog
}

export function notifications(state=default_state, action){
  switch(action.type){
    case "UPDATE_NOTIFICATIONS_CATALOG":
      return { catalog_with_config: fill_catalog(action.catalog, state.config), catalog: action.catalog, config: state.config, unread: action.unread }
      break;
    case "UPDATE_NOTIFICATIONS_CONFIG":
      return { catalog_with_config: fill_catalog(state.catalog, action.config), catalog: status.catalog, config: action.config, unread: action.unread }
      break;
    case "UPDATE_NOTIFICATIONS_UNREAD":
      return merge( state, {unread: action.unread})
    case "@RPC_EVENT/notifications.new":
      return merge( state, {unread: [action.notification].concat(state.unread)})
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
      return merge( state, {unread})
  }
  return state
}

export default notifications
