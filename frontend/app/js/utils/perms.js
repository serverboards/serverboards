import store from './store'

export function perms(){
  const state=store.getState()
  if (state.auth.user)
    return store.getState().auth.user.perms
  return []
}

export function has_perm(perm){
  return perms().indexOf(perm)>=0
}

export default {perms, has_perm}
