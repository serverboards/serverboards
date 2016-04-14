// Default status, put over current
const default_state={
  logged_in: false,
  user: undefined
}

export const auth = (state = default_state , action) => {
  var state=Object.assign({}, state) // copy state
  switch(action.type){
    case "AUTH_LOGIN":
      state.logged_in=true
      state.user=action.user
      break;
    case 'AUTH_LOGOUT':
      state.logged_in=false
      state.user=undefined
      break;
  }
  return state
}
