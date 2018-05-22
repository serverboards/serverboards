import {merge} from 'app/utils'

var default_state={
  services: undefined,
  catalog: undefined,
  current: {
    service: undefined,
    template: undefined,
  }
}

function get_template(catalog, type){
  if (!catalog)
    return undefined
  return catalog.find( (t) => t.type == type )
}

function services(state=default_state, action){
  switch(action.type){
    case 'UPDATE_SERVICE_CATALOG': {
      let current = state.current
      if (current.service){
        current = merge( current, {
          template: get_template(action.services, current.service.type)
        } )
      }
      return merge(state, {catalog: action.services, current} )
    }
    case 'UPDATE_ALL_SERVICES':
      return merge(state, {services: action.services} )
    case '@RPC_EVENT/service.updated': {
      let changed = false
      let services = state.services
      if (state.services){
        services = state.services.map( s => {
          if (s.uuid == action.service.uuid){
            changed = true
            return action.service
          }
          return s
        })
        if (!changed)
          services.push(action.service)
        changed = true
      }

      let current = state.current
      if (current.service && action.service.uuid == current.service.uuid){
        current = merge( current, {service: action.service} )
        changed = true
      }
      if (!changed)
        return state
      return merge(state, {services, current})
    }
    case "SERVICE_SET_CURRENT":
      return merge(state, {
        current: merge( state.current, {
          service: action.payload,
          template: get_template(state.catalog, action.payload && action.payload.type)
        } )})
    case "CACHE_CLEAN_ALL":
      return {...state, services: undefined, catalog: undefined}
  }

  return state
}

export default services
