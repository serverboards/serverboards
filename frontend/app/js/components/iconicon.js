import React from 'react'
require("sass/logoicon.sass")

function IconIcon(props){
  if (!props.icon)
    return null
  if (props.icon.endsWith(".svg") || props.icon.endsWith(".png") ||
      props.icon.endsWith(".jpg") || props.icon.endsWith(".gif") ){
    const servername=localStorage.servername || window.location.origin
    const imgurl=`${servername}/static/${props.plugin}/${props.icon}`
    return (
      <span className={`ui iconicon ${props.className} ${props.src ? "with background" : ""}`}>
        {props.src ? (
          <img src={props.src} className="base"/>
        ) : null}
        <span className="icon">
          <img src={imgurl}/>
        </span>
      </span>
    )
  }
  return (
    <span className={`ui iconicon ${props.className} ${props.src ? "with background" : ""}`}>
      {props.src ? (
        <img src={props.src} className="base"/>
      ) : null}
      <i className={`ui ${props.icon} icon`}/>
    </span>
  )
}

export default IconIcon
