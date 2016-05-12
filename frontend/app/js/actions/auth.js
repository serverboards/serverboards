import rpc from '../rpc'
import Flash from '../flash'

export function logout(){
  return {
    type: 'AUTH_LOGOUT'
  }
}
export function login(params){
  console.log('params %o', params)
  return function(dispatch){
    dispatch({type:"AUTH_TRY_LOGIN"})

    rpc
      .call("auth.auth",{email:params.email, password:params.password, type:"basic"})
      .then(function(user){
        if (user){
          Flash.log("Logged in as "+user.email)
          dispatch({type:"AUTH_LOGIN", user: user})
        }
        else{
          Flash.error("Invalid email/password")
          dispatch({type:"AUTH_FAIL_LOGIN"})
        }
      })
      .catch(function(msg){
        console.error(msg)
        Flash.error("Cant login "+msg)
        dispatch({type:"AUTH_FAIL_LOGIN"})
      })
  }
}

export function user_list(){
  return function(dispatch){
    rpc.call("user.list", []).then((list) => {
      dispatch({type:'AUTH_USER_LIST', users: list})
    })
  }
}

export function group_list(){
  return function(dispatch){
    rpc.call("group.list", []).then((list) => {
      let groups=[]
      Promise.all( list.map((g) => {
        return Promise.all([
          Promise.resolve(g),
          rpc.call("group.list_users", [g]),
          rpc.call("group.list_perms", [g])
        ])
      }) ).then(function(gs){
        gs.map( (g) => {
          groups.push( {name: g[0], users: g[1], perms: g[2]} )
        })
        dispatch({type:'AUTH_GROUP_LIST', groups: groups})
      } )
    })
  }
}
