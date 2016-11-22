import store from './store'

export function perms(){
  return store.getState().auth.user.perms
}

export function has_perm(perm){
  return perms().indexOf(perm)>=0
}

export default {perms, has_perm}
