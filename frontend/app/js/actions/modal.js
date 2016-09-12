import { push } from 'react-router-redux'
import store from 'app/utils/store'

/**
 * Sets the given modal (React component) with the given data as props
 */
export function set_modal(modal, data={}){
  const location = store.getState().routing.locationBeforeTransitions.pathname
  return push({
    pathname: location,
    state: {modal, data}
  })
}
