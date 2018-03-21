import React from 'react';

import Top from 'app/containers/top'
import Login from 'app/containers/login.js'
import Console from 'app/containers/console.js'
import FlashMessageList from 'app/containers/flashmessages.js'
import Router from 'app/router'
import get_modal from './modalfactory'
import Piwik from 'app/containers/piwik.js'
import {ErrorBoundary} from 'app/components/error'

function Main(props){
  //console.log("Main component props %o", props.location)
  let modal = []
  if (props.location && props.location.state && props.location.state.modal){
    const mod = props.location.state
    const Modal = get_modal(mod.modal)
    if (Modal){
      // console.log("Render Modal %o -> %o", mod.modal, Modal)
      const dispatch = require('app/utils/store').default.dispatch
      const goBack = require('react-router-redux').goBack
      modal=(
        <ErrorBoundary>
          <Modal {...mod.data} onClose={ () => dispatch( goBack() ) }/>
        </ErrorBoundary>
      )
    }
    else{
      console.error("Error rendering modal: %o. Not found.", mod.modal)
    }
  }

  var contents=[]
  if (props.logged_in)
    contents=(
      <div>
        <Top onLogout={props.onLogout}/>
        <ErrorBoundary>
          <div className="ui main area">
            <Router/>
            {modal}
          </div>
        </ErrorBoundary>
      </div>
    )
  else
    contents=(
      <Login onLogin={props.onLogin}/>
    )

  return (
    <div>
      <Piwik/>
      <FlashMessageList/>
      <Console/>
      {contents}
    </div>
  )
}

export default Main
