import React from 'react';

var Login = React.createClass({
  render: function(){
    return (
      <div className="ui form">
        Please Login
        <br/>
        <label>Email</label>
        <input type="email" id="email"/>
        <br/>
        <label>Password</label>
        <input type="password" id="password"/>
      </div>
    )
  }
})

export default Login;
