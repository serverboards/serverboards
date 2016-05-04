var default_state={
  services: [
    {shortname:"SBDS", name:"Serverboards"},
    {shortname:"HMTV", name:"Healthmotiv"},
    {shortname:"IBT", name:"Ibertabac"},
    {shortname:"CRLBTS", name:"Coralbits"},
    {shortname:"AISOY", name:"Aisoy"},
  ],
  current: undefined,
  components: []
}

function service(state=default_state, action){
  switch(action.type){
    case '@@router/LOCATION_CHANGE':
      var current=action.payload.pathname.replace(RegExp("^/service/([^/]*)/.*"), "$1")
      return Object.assign({}, state, {current: current} )
    case 'UPDATE_COMPONENTS':
      return Object.assign({}, state, {components: action.components} )
  }
  return state
}

export default service
