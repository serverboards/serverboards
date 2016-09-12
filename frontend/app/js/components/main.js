import React from 'react';

import Top from 'app/containers/top'
import Login from 'app/containers/login.js'
import Console from 'app/containers/console.js'
import FlashMessageList from 'app/containers/flashmessages.js'
import Router from 'app/router'
import Piwik from 'app/containers/piwik.js'

function Main(props){
  //console.log("Main component props %o", props.onLogin)
  var contents=[]
  if (props.logged_in)
    contents=(
      <div>
        <Top onLogout={props.onLogout}/>
        <div className="ui main area">
          <Router/>
        </div>
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
