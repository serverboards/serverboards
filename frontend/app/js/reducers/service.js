var default_state={
  services: [],
  current: undefined,
  current_components: undefined,
  available_components: undefined
}

function service(state=default_state, action){
  switch(action.type){
    case '@@router/LOCATION_CHANGE':
      var current=action.payload.pathname.replace(RegExp("^/service/([^/]*)/.*"), "$1")
      var current_components=state.current_components
      if (current!=state.current){ // On change of location, no current components
        current_components=undefined
      }
      return Object.assign({}, state, {current, current_components} )
    case 'UPDATE_ALL_SERVICES':
      return Object.assign({}, state, {services: action.services} )
    case 'UPDATE_COMPONENTS':
      return Object.assign({}, state, {available_components: action.components} )
    case 'UPDATE_ALL_COMPONENTS':
      return Object.assign({}, state, {all_components: action.components} )
    case 'UPDATE_SERVICE_COMPONENTS':
      return Object.assign({}, state, {current_components: action.components} )
    case '@RPC_EVENT/service.added':
      return Object.assign({}, state, {services: state.services.concat(action.service) } )
    case '@RPC_EVENT/service.deleted':
      return Object.assign({}, state, {services: state.services.filter( s => s.shortname != action.shortname ) } )
    case '@RPC_EVENT/service.updated':
      let services = state.services.map( s => {
        if (s.shortname == action.shortname){
          return action.service
        }
        return s
      })
      let current_components=state.current_components
      if (state.current==action.shortname)
        current_components=action.service.components

      return Object.assign({}, state, {services, current_components})
  }
  return state
}

export default service
