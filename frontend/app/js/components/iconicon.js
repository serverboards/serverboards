import React from 'react'
require("sass/logoicon.sass")

function IconIcon(props){
  return (
    <span className="ui iconicon">
      <img src={props.src}/>
      <i className={`ui ${props.icon} icon`}/>
    </span>
  )
}

export default IconIcon
