export function logout(){
  return {
    type: 'AUTH_LOGOUT'
  }
}
export function login(user){
  return {
    type: 'AUTH_LOGIN',
    user
  }
}
