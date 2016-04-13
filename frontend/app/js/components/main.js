import React from 'react';

import Empty from './empty'
import Login from './login'
import Top from './top'

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
    this.setState({logged_in: status})
    console.log("Handled login %o", status)
  },
  render : function(){
    if (this.state.logged_in)
      return (
        <div>
          <Top onLogout={() => this.handle_login(false)}/>
          <Sidebar/>
          <Central/>
        </div>
      )
    else
      return (
        <div>
          <Login onLogin={() => this.handle_login(true)}/>
        </div>
      )
  }
})

export default Main
