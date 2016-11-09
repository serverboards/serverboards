import React from 'react'
import LogoIcon from '../logoicon'

function Selector(props){
  console.log(props)
  const selected=props.current
  return (
    <div className="ui vertical menu serverboard selector">
      <div className="ui search">
        <div className="ui icon input">
          <input className="prompt" type="text" placeholder="Search by name"/>
          <i className="search icon"/>
        </div>
      </div>
      <div className="menu">
        {props.serverboards.map( (s) => (
          <a className={`item ${ s.shortname == selected ? "active" : ""}`} onClick={() => {props.onServiceSelect(s.shortname); props.onClose()}}>
            <div style={{display:"inline-block", paddingRight: 10}}>
              <LogoIcon name={s.shortname}/>
            </div>
            {s.name}
          </a>
        ))}
      </div>
    </div>
  )
}

export default Selector
