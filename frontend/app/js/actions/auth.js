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
