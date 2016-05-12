// Default status, put over current
const default_state={
  logged_in: false,
  user: undefined,
  users: undefined,
  groups: undefined
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
    case 'AUTH_USER_LIST':
      state.users=action.users
      break;
    case 'AUTH_GROUP_LIST':
      state.groups=action.groups
      break;
  }
  return state
}

export default auth
