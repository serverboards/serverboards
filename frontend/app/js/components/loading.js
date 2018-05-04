import React from 'react'
import i18n from 'app/utils/i18n'

const loading = require('app/../imgs/loading.gif')

function Loading(props){
  return (
    <div className="ui active inverted dimmer" style={{overflow:"hidden"}}>
      <div className="ui text">
        <img src={loading}/>
        <h1>{i18n("Loading data")}</h1>
        {props.children}
      </div>
    </div>
  )
}

Loading.Widget = function(props){
  return (
    <div className="ui extends" style={{overflow:"hidden", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"}}>
      <i className="ui spinner loading icon huge"/>
      <div className="ui text" style={{marginTop: 10}}>
        <h1>{i18n("Loading data")}</h1>
        {props.children}
      </div>
    </div>
  )
}

export default Loading
