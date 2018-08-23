const default_state = {
  menu: null,
  user: {},
  sidebar: localStorage.show_sidebar == "true",
  screens: [],
  project_selector: false,
}

function top(state=default_state, action){
  switch(action.type){
    case 'TOP_TOGGLE_MENU':
      if (state.menu==action.menu)
        state={...state, menu: undefined}
      else
        state={...state, menu: action.menu}
      break;
    case 'TOP_TOGGLE_SIDEBAR':
      // I store already modified
      localStorage.show_sidebar = state.sidebar ? "false" : "true"
      state={...state, sidebar: !state.sidebar}
      break;
    case 'TOP_TOGGLE_PROJECT_SELECTOR':
      state={...state, project_selector: !state.project_selector}
      break;
    case 'TOP_UPDATE_SCREENS':
      state = {...state, screens: action.payload}
      break;
  }
  return state
}

export default top
