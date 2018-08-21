import React from 'react'

let hooks = {}

export function add(name, hook){
  let current = hooks[name] || []
  current.push(hook)
  hooks[name] = current
}

export function Hook(props){
  const current = hooks[props.name] || []
  console.log("Show hooks", current)
  return (
    <React.Fragment>
      {current.map((Element,i) => (
        <Element key={i} {...props}/>
      ))}
    </React.Fragment>
  )
}

Hook.add = add

export default Hook
