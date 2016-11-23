import React from 'react'

function Default(props){
  return (
    <div>
      <div className="ui top header secondary menu">
        <h2 className="ui header">General information</h2>
      </div>
      <div className="ui text container">
        <div className="field">
          <label>Version: </label>
          <span className="ui meta">{SERVERBOARDS_VERSION}</span>
        </div>
        <div className="field">
          <label>Connected to server: </label>
          <span className="ui meta">{localStorage.servername || window.location.origin}</span>
        </div>
      </div>

    </div>
  )
}

export default Default
