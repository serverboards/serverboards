var default_state={
  services: [
    {shortname:"SBDS", name:"Serverboards"},
    {shortname:"HMTV", name:"Healthmotiv"},
    {shortname:"IBT", name:"Ibertabac"},
    {shortname:"CRLBTS", name:"Coralbits"},
    {shortname:"AISOY", name:"Aisoy"},
  ],
  current: undefined
}

function service(state=default_state, action){
  switch(action.type){
    case '@@router/LOCATION_CHANGE':
      var current=action.payload.pathname.replace(RegExp("^/service/([^/]*)/.*"), "$1")
      return Object.assign({}, state, {current: current} )
  }
  return state
}

export default service
