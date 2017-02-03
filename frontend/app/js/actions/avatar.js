import rpc from 'app/rpc'

export function get_avatar(email){
  return function(dispatch){
    dispatch({type: "AVATAR_SET", payload: {email: email, avatar: "loading"}})
    rpc.call("settings.user.get", [email, "profile_avatar"]).then( (avatar) => {
      dispatch({type: "AVATAR_SET", payload: {email: email, avatar: avatar.avatar}})
    }).catch( () => {
      dispatch({type: "AVATAR_SET", payload: {email: email, avatar: "unknown"}})
    })
  }
}
