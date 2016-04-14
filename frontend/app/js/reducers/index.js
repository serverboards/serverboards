import { combineReducers } from 'redux'
import {auth} from './auth'

var reducers ={
  auth
}

reducers.debug=(state={}, action) => {
    console.log("REDUX %s: %o",action.type, action)
    return state
  }


const all_reducers = combineReducers( reducers )

export default all_reducers
