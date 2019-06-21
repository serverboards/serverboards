import { combineReducers } from 'redux'
import auth from './auth'
import flash from './flash'
import { connectRouter } from 'connected-react-router'

var reducers = [
  'auth', 'action', 'flash', 'console', 'menu', 'project', 'services',
  'settings', 'notifications', 'rpc', 'avatar', 'issues',
  'rules_v2'
]

reducers = reducers.reduce(function(acc, r){ acc[r]=require('./'+r).default; return acc; }, {})

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  ...reducers
})

export default createRootReducer
