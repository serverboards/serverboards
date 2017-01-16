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
  }
  return state
}

export default services
