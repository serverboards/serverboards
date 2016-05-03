import React from 'react';

import Sidebar from './sidebar'
import Top from '../containers/top'
import Login from '../containers/login.js'
import Console from '../containers/console.js'
import FlashMessageList from '../containers/flashmessages.js'
import Router from '../router'

function Main(props){
  console.log("Main component props %o", props.onLogin)
  var contents=[]
  if (props.logged_in)
    contents=(
      <div className="ui main">
        <Top onLogout={props.onLogout}/>
        <Sidebar/>
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
      <FlashMessageList/>
      <Console/>
      {contents}
    </div>
  )
}

export default Main
