import React, {PropTypes} from 'react';

var LoginView = React.createClass({
  getInitialState : function(){
    return {email: '', password: ''}
  },
  update_password(event){
    this.setState({password: event.target.value})
  },
  update_email(event){
    this.setState({email: event.target.value})
  },
  handleSubmit(ev){
    ev.preventDefault()
    this.props._onSubmit(this.state)
  },
  render: function(){
    return (
      <form className="ui form" method="POST" onSubmit={this.handleSubmit}>
        <div className="ui small modal active" id="login">
          <div className="header">
            Login
          </div>

          <div className="content">
            <div className="field">
              <label>Email</label>
              <input type="email" name="email" placeholder="user@company.com"
                onChange={this.update_email} value={this.state.email}
                />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" name="password" placeholder="*******"
                onChange={this.update_password} value={this.state.password}
                />
            </div>
            <div class="ui error message"></div>
          </div>

          <div className="actions">
            <button type="button" className="ui positive right labeled icon button"
              onClick={this.handleSubmit}>
              Login
              <i className="caret right icon"></i>
            </button>
          </div>
        </div>
      </form>
    )
  },
  propTypes: {
    _onSubmit: PropTypes.func.isRequired
  }
})


export default LoginView
