// using an ES6 transpiler, like babel
import React from 'react';
import { Router, Route, Link, hashHistory } from 'react-router'

import Main from './components/main.js'
import Login from './containers/login.js'

var ServerboardsRouter = React.createClass({
  getInitialState : function(){
    return {
      logged_in: false
    }
  },
  handleLogin : function(){
    var status=true
    this.setState({logged_in: status})
  },
  render: function(){
    if (!this.state.logged_in){
      return (
        <Login onLogin={this.handleLogin}/>
      )
    }
    else{
      return (
        <Router history={hashHistory}>
          <Route path="/" component={Main}/>
        </Router>
      )
    }
  }
})

export default ServerboardsRouter
