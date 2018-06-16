// Default status, put over current
const default_avatar=require('../../imgs/square-favicon.svg')

const default_state={
  logged_in: false,
  tracking: false,
  user: undefined,
  users: undefined,
  groups: undefined,
  all_perms: undefined,
  lang: "en",
  lang_counter: 0,
  avatar: default_avatar,
  logging: false, // this is used to mark already loading user. Actually its kept for UI reasons until logout.
  licenses: [], // missing licenses to agree
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
  const type=action.type
  if (!type.startsWith("AUTH_") && !type.startsWith("@RPC_EVENT/"))
    return state
  var state=Object.assign({}, state) // copy state
  switch(type){
    case "AUTH_LOGIN":
      state.logged_in=true
      state.user=action.user
      break;
    case 'AUTH_LOGOUT':
      state.logged_in=false
      state.user=undefined
      state.logging=false;
      state.avatar=default_avatar
      break;
    case 'AUTH_USER_LIST':
      state.users=sort_users( action.users )
      break;
    case 'AUTH_GROUP_LIST':
      state.groups=sort_groups( action.groups )
      break;
    case 'AUTH_PERMS_LIST':
      state.all_perms=action.perms
      break;
    case 'AUTH_PROFILE_AVATAR':
      state.avatar=action.avatar
      break;
    case 'AUTH_SET_LANG':
      state.lang=action.lang
      state.lang_counter+=1
      require("moment").locale(action.lang)
      break;
    case 'AUTH_TRY_LOGIN':
      state.logging=true;
      break;
    case 'AUTH_FAIL_LOGIN':
      state.logging=false;
      break;
    case 'AUTH_SET_TRACKING':
      state.tracking=action.payload;
      break;
    case 'AUTH_SET_LICENSES':
      state.licenses=action.payload;
      break;
    case '@RPC_EVENT/group.user_added':
      state.groups = state.groups.map( (g) => {
        if (g.name == action.group){
          return Object.assign({}, g, {users: g.users.concat(action.email)})
        }
        return g
      })
      console.log(state)
      break;
    case '@RPC_EVENT/group.user.deleted':
      state.groups = state.groups.map( (g) => {
        if (g.name == action.group){
          return Object.assign({}, g,
            { users: g.users.filter( (u) => u!=action.email ) } )
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
    case '@RPC_EVENT/group.perm.deleted':
      state.groups = state.groups.map( (g) => {
        if (g.name == action.group){
          console.log("Remove perm at group %o", g)
          return Object.assign({}, g,
            { perms: g.perms.filter( (u) => u!=action.perm ) } )
        }
        return g
      })
    break;
    case '@RPC_EVENT/group.created':
      state.groups = sort_groups(
        state.groups.concat( { name: action.group, users: [], perms: []} )
      )
    break;
    case '@RPC_EVENT/group.deleted':
      state.groups = sort_groups(
        state.groups.filter( (g) => g.name != action.group )
      )
    break;
    case '@RPC_EVENT/user.created':
      state.users = sort_users( state.users.concat( action.user ) )
    break;
    case '@RPC_EVENT/user.updated':
      if (state.user.id == action.user.id)
        state.user=action.user
      if (!state.users)
        return state
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
