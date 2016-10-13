import React from 'react'

function Header(props){
  return (
    <div className="ui top menu">
      <a className="item">
        <label>Since</label>
        <div className="value">23 March 2016- 8:00</div>
      </a>
      <a className="item">
        <label>Until</label>
        <div className="value">now</div>
      </a>
    </div>
  )
}

export default Header
