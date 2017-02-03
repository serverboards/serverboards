import React from 'react'
import store from 'app/utils/store'
import rpc from 'app/rpc'

const default_avatar=require('../../imgs/square-favicon.svg')

function Avatar(props){
  let avatar
  switch (props.avatar){
    case undefined:
      avatar = default_avatar;
      break;
    case "unknown":
      avatar = default_avatar;
      break;
    case "loading":
      return (
        <i className="loading spinner icon"/>
      )
    default:
      avatar = props.avatar || default_avatar
      break;
  }
  return (
    <img src={avatar} className={props.className}/>
  )
}

export default Avatar
