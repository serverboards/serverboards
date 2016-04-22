import React from 'react';

import Empty from './empty'
import Top from '../containers/top'
import Login from '../containers/login.js'
import Console from '../containers/console.js'
import FlashMessageList from '../containers/flashmessages.js'
import Router from '../router'

var Sidebar = Empty

function Main(props){
  console.log("Main component props %o", props.onLogin)
  var contents=[]
  if (props.logged_in)
    contents=(
      <div>
        <Top onLogout={props.onLogout}/>
        <Sidebar/>
        <Router/>
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
