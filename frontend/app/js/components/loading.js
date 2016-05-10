import React from 'react'

function Loading(props){
  return (
    <div className="">
      <h1>Loading data</h1>
      {props.children}
    </div>
  )
}

export default Loading
