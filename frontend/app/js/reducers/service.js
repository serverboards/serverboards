var default_state={
  services: [],
  current: undefined,
  components: []
}

function service(state=default_state, action){
  switch(action.type){
    case '@@router/LOCATION_CHANGE':
      var current=action.payload.pathname.replace(RegExp("^/service/([^/]*)/.*"), "$1")
      return Object.assign({}, state, {current: current} )
    case 'UPDATE_ALL_SERVICES':
      return Object.assign({}, state, {services: action.services} )
    case 'UPDATE_COMPONENTS':
      return Object.assign({}, state, {components: action.components} )
  }
  return state
}

export default service
