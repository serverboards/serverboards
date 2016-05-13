// Default status, put over current
const default_state={
  logged_in: false,
  user: undefined,
  users: undefined,
  groups: undefined
}

// http://stackoverflow.com/questions/1179366/is-there-a-javascript-strcmp#1179377
function strcmp(str1,str2){
  return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
}

function sort_users(users){
  return users.sort(function(a, b){
    if (a.is_active && !b.is_active)
      return -1;
    if (b.is_active && !a.is_active)
      return 1;
    return strcmp(a.email, b.email)
  })
}

function sort_groups(groups){
  return groups.sort(function(a,b){
    return strcmp(a.name, b.name)
  })
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
      state.users=sort_users( action.users )
      break;
    case 'AUTH_GROUP_LIST':
      state.groups=sort_groups( action.groups )
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
    case '@RPC_EVENT/group.added':
      state.groups = sort_groups(
        state.groups.concat( { name: action.group, users: [], perms: []} )
      )
    break;
    case '@RPC_EVENT/user.added':
      state.users = sort_users( state.users.concat( action.user ) )
    break;
    case '@RPC_EVENT/user.updated':
      state.users = state.users.map( (u) => {
        if (u.email != action.user.email)
          return u
        return action.user
      })
      state.users = sort_users( state.users )
    break;
  }
  return state
}

export default auth
