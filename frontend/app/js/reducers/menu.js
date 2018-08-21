const default_state = {menu: null, user: {}, sidebar: true, screens: []}

function top(state=default_state, action){
  switch(action.type){
    case 'TOP_TOGGLE_MENU':
      if (state.menu==action.menu)
        state={...state, menu: undefined}
      else
        state={...state, menu: action.menu}
      break;
    case 'TOP_TOGGLE_SIDEBAR':
      state={...state, sidebar: !state.sidebar}
      break;
    case 'TOP_UPDATE_SCREENS':
      state = {...state, screens: action.payload}
      break;
  }
  return state
}

export default top
