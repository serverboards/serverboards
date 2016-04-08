import React from 'react';

var Login = React.createClass({
  render: function(){
    return (
      <div className="ui form">
        <div className="ui small modal active" id="login">
          <div className="header">
            Login
          </div>
          <div className="content">
            <div className="field">
              <label>Email</label>
              <input type="email" id="email" placeholder="user@company.com"/>
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" id="password" placeholder="*******"/>
            </div>
          </div>

          <div className="actions">
            <button type="button" className="ui positive right labeled icon button">
              Login
              <i className="caret right icon"></i>
            </button>
          </div>
        </div>
      </div>
    )
  }
})

export default Login;
