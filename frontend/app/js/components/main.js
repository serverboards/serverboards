import React from 'react';

import Top from 'app/containers/top'
import Login from 'app/containers/login.js'
import Console from 'app/containers/console.js'
import FlashMessageList from 'app/containers/flashmessages.js'
import Router from 'app/router'
import get_modal from './modalfactory'

function Main(props){
  //console.log("Main component props %o", props.location)
  let modal = []
  if (props.location.state && props.location.state.modal){
    const mod = props.location.state
    const Modal = get_modal(mod.modal)
    modal=(
      <Modal {...mod.data}/>
    )
  }

  var contents=[]
  if (props.logged_in)
    contents=(
      <div>
        <Top onLogout={props.onLogout}/>
        <div className="ui main area">
          <Router/>
          {modal}
        </div>
      </div>
    )
  else
    contents=(
      <Login onLogin={props.onLogin}/>
    )

  return (
    <div>
      <FlashMessageList/>
      <Console/>
      {contents}
    </div>
  )
}

export default Main
