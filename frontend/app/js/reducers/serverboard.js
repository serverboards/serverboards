var default_state={
  serverboards: [],
  current: undefined,
  current_services: undefined,
  available_services: undefined
}

function serverboard(state=default_state, action){
  switch(action.type){
    case '@@router/LOCATION_CHANGE':
      var current=action.payload.pathname.replace(RegExp("^/serverboard/([^/]*)/.*"), "$1")
      var current_services=state.current_services
      if (current!=state.current){ // On change of location, no current services
        current_services=undefined
      }
      return Object.assign({}, state, {current, current_services} )
    case 'UPDATE_ALL_SERVERBOARDS':
      return Object.assign({}, state, {serverboards: action.serverboards} )
    case 'UPDATE_SERVICES':
      return Object.assign({}, state, {available_services: action.services} )
    case 'UPDATE_ALL_SERVICES':
      return Object.assign({}, state, {all_services: action.services} )
    case 'UPDATE_SERVERBOARD_SERVICES':
      return Object.assign({}, state, {current_services: action.services} )
    case '@RPC_EVENT/serverboard.added':
      return Object.assign({}, state, {serverboards: state.serverboards.concat(action.serverboard) } )
    case '@RPC_EVENT/serverboard.deleted':
      return Object.assign({}, state, {serverboards: state.serverboards.filter( s => s.shortname != action.shortname ) } )
    case '@RPC_EVENT/serverboard.updated':
      let serverboards = state.serverboards.map( s => {
        if (s.shortname == action.shortname){
          return action.serverboard
        }
        return s
      })
      let current_services=state.current_services
      if (state.current==action.shortname)
        current_services=action.serverboard.services

      return Object.assign({}, state, {serverboards, current_services})
  }
  return state
}

export default serverboard
