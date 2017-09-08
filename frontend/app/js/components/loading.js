import React from 'react'

const loading = require('app/../imgs/loading.gif')

function Loading(props){
  return (
    <div className="ui active inverted dimmer" style={{overflow:"hidden"}}>
      <div className="ui text">
        <img src={loading}/>
        <h1>Loading data</h1>
        {props.children}
      </div>
    </div>
  )
}

export default Loading
