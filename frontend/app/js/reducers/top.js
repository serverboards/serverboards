const default_state = {menu: null, user: {}}

function top(state=default_state, action){
  switch(action.type){
    case 'TOP_TOGGLE_MENU':
      if (state.menu==action.menu)
        state=Object.assign({}, state, {menu: undefined})
      else
        state=Object.assign({}, state, {menu: action.menu})
      break;
  }
  console.log("Current state is %o", state)
  return state
}

export default top
