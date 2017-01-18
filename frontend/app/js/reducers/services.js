import {merge} from 'app/utils'

var default_state={
  services: undefined,
  catalog: undefined
}


function services(state=default_state, action){
  switch(action.type){
    case 'UPDATE_SERVICE_CATALOG':
      return merge(state, {catalog: action.services} )
    case 'UPDATE_ALL_SERVICES':
      return merge(state, {services: action.services} )
    case '@RPC_EVENT/service.updated':
      if (!state.services)
        return state
      let changed = false
      let current_services = state.services.map( s => {
        if (s.uuid == action.service.uuid){
          changed = true
          return action.service
        }
        return s
      })
      if (!changed)
        current_services.push(action.service)
      return merge(state, {services: current_services})
  }

  return state
}

export default services
