import React from 'react';

import Empty from './empty'
import Login from './login'
import Top from './top'
import FlashMessageList from './flash'

var Sidebar = Empty
var Central = Empty

var flash_message_list

var Main = React.createClass({
  getInitialState : function(){
    return {
      loggedIn: false,
    }
  },
  handle_login : function(status){
    console.log("Handle login %o", status)
    this.setState({logged_in: status})
  },
  render : function(){
    if (this.state.logged_in)
      return (
        <div>
          <FlashMessageList/>
          <Top onLogout={() => this.handle_login(false).bind(this)}/>
          <Sidebar/>
          <Central/>
        </div>
      )
    else
      return (
        <div>
          <FlashMessageList/>
          <Login onLogin={() => this.handle_login(true).bind(this)}/>
        </div>
      )
  }
})

export default Main
