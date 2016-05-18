import { combineReducers } from 'redux'
import auth from './auth'
import flash from './flash'
import { routerReducer } from 'react-router-redux'

var reducers = ['auth','flash','console','top','serverboard']

reducers = reducers.reduce(function(acc, r){ acc[r]=require('./'+r).default; return acc; }, {})
reducers.routing = routerReducer

/*
console.log(reducers)
reducers.debug=(state={}, action) => {
    console.log("REDUX %s: %o",action.type, action)
    return state
  }
*/

const all_reducers = combineReducers( reducers )

export default all_reducers
