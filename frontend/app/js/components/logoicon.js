import React from 'react';

require("../../sass/logoicon.sass")

function logo(name){
  let ns=name.split(' ')
  if (ns.length>=2){
    return ns.map((n) => n[0]).join('').slice(0,2).toUpperCase()
  }
  return name.slice(0,2).toUpperCase()
}


function LogoIcon(props){
  return (
    <div className={`ui logoicon ${props.color || ""}`}><span>{logo(props.name)}</span></div>
  )
}

export default LogoIcon
