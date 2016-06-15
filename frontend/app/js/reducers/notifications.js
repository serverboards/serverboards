// Default status, put over current
const default_state={
  catalog: [],
  config: {}
}

function fill_catalog(catalog, config){
  return catalog.map( (cat) => {
    let fields = cat.fields.map( (f) => {
      let conf=(config[cat.channel] || {}).config || {}
      return $.extend({}, f, {value: conf[f.name]})
    })
    let ret= $.extend({}, cat, {fields: fields})
    return ret
  })
}

export function notifications(state=default_state, action){
  switch(action.type){
    case "UPDATE_NOTIFICATIONS_CATALOG":
      return { catalog: fill_catalog(action.catalog, state.config), config: state.config }
      break;
    case "UPDATE_NOTIFICATIONS_CONFIG":
      return { catalog: fill_catalog(state.catalog, action.config), config: action.config }
      break;
  }
  return state
}

export default notifications
