import { goto } from 'app/utils/store'
import store from 'app/utils/store'

/**
 * Sets the given modal (React component) with the given data as props
 */
export function set_modal(modal, data={}){
  const location = store.getState().router.location.pathname
  return push({
    pathname: location,
    state: {modal, data}
  })
}

export function dispatch_set_modal(modal, data){
  store.dispatch( set_modal(modal, data) )
}
