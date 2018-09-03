import React from 'react'
import {connect} from 'react-redux'
import {added_more_hooks} from 'app/actions/menu'
import store from 'app/utils/store'

let hooks = {}

export function add(name, hook){
  let current = hooks[name] || []
  current.push(hook)
  hooks[name] = current
  store.dispatch( added_more_hooks() )
}

export function HookView(props){
  const current = hooks[props.name] || []
  return (
    <React.Fragment key={props.hooks}>
      {current.map((Element,i) => (
        <Element key={i} {...props}/>
      ))}
    </React.Fragment>
  )
}

export const Hook = connect(
  (props) => ({
    hooks: props.menu.hooks,
  })
)(HookView)

Hook.add = add
Hook.hooks = hooks

export default Hook
