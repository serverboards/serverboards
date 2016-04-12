import React from 'react'

var Top = React.createClass({
  handle_logout : function(){
    this.props.onLogout()
  },
  render : function(){
    return (
      <nav className="ui top fixed menu">
        <div className="item">
          Serverboards
        </div>
        <a href="#!" className="item right" onClick={this.handle_logout}>
          Logout
        </a>
      </nav>
    )
  }
})

export default Top
