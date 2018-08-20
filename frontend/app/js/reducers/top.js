const default_state = {menu: null, user: {}, sidebar: true}

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
  }
  return state
}

export default top
