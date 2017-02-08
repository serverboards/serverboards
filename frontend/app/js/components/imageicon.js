import React from 'react'
require("sass/logoicon.sass")

function logo(name){
  if (!name)
    return ''
  let ns=name.split(' ')
  if (ns.length>=2){
    return ns.map((n) => n[0]).join('').slice(0,2).toUpperCase()
  }
  return name.slice(0,2).toUpperCase()
}

let count=0

function ImageIcon(props){
  return (
    <div className={`ui imageicon image ${props.className || "tiny"}`}>
      <img src={props.src}/>
      <span>{logo(props.name)}</span>
    </div>
  )
}

export default ImageIcon
