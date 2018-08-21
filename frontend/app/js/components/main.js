import React from 'react';

import Top from 'app/containers/menu/top'
import Login from 'app/containers/login.js'
import Console from 'app/containers/console.js'
import FlashMessageList from 'app/containers/flashmessages.js'
import Router from 'app/router'
import get_modal from './modalfactory'
import Piwik from 'app/containers/piwik.js'
import {ErrorBoundary} from 'app/components/error'
import Legal from 'app/components/login/legal'
import Sidebar from 'app/containers/menu/sidebar'


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
  if (!props.logged_in) {
    contents=(
      <Login onLogin={props.onLogin}/>
    )
  } else if (props.licenses.length != 0) {
    contents = (
      <Legal
        lang={props.lang}
        license={props.licenses[0]}
        onLogout={props.onLogout}
        onAcceptLegal={() => props.onAcceptLegal(props.licenses[0].id)}
        />
    )
  } else {
    contents=(
      <div id="chrome">
        <Top onLogout={props.onLogout}/>
        <Sidebar/>
        <ErrorBoundary>
          <div className="ui main area" id="mainarea">
            <Router/>
            {modal}
          </div>
        </ErrorBoundary>
      </div>
    )
  }

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
