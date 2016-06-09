import React from 'react';
import {random_color} from '../utils'

require("sass/logoicon.sass")

function logo(name){
  let ns=name.split(' ')
  if (ns.length>=2){
    return ns.map((n) => n[0]).join('').slice(0,2).toUpperCase()
  }
  return name.slice(0,2).toUpperCase()
}

function LogoIcon(props){
  let color=props.color
  if (!color){
    color=random_color(props.name)
  }

  return (
    <div className={`ui logoicon ${color}`}><span>{logo(props.name)}</span></div>
  )
}

export default LogoIcon
