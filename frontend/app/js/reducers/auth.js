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
    case '@RPC_EVENT/group.user_added':
      state.groups = state.groups.map( (g) => {
        if (g.name == action.group){
          return Object.assign({}, g, {users: g.users.concat(action.user)})
        }
        return g
      })
      console.log(state)
      break;
    case '@RPC_EVENT/group.user_removed':
      state.groups = state.groups.map( (g) => {
        if (g.name == action.group){
          return Object.assign({}, g,
            { users: g.users.filter( (u) => u!=action.user ) } )
        }
        return g
      })
      console.log(state)
      break;
    case '@RPC_EVENT/group.perm_added':
      state.groups = state.groups.map( (g) => {
        if (g.name == action.group){
          return Object.assign({}, g, {perms: g.perms.concat(action.perm)})
        }
        return g
      })
      break;
    case '@RPC_EVENT/group.perm_removed':
      state.groups = state.groups.map( (g) => {
        if (g.name == action.group){
          console.log("Remove perm at group %o", g)
          return Object.assign({}, g,
            { perms: g.perms.filter( (u) => u!=action.perm ) } )
        }
        return g
      })
      break;
    case '@RPC_EVENT/user.added':
      console.log(action)
      state.users = state.users.concat( action.user )
      console.log(state.users)
      break;
  }
  return state
}

export default auth
