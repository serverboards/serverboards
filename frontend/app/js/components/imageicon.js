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

const ImageIcon = React.createClass({
  updateText(){
    var svg=this.refs.img.children[0]
    var svgDoc=svg.contentDocument;
    var text=svgDoc.getElementById("modifyme")
    text.textContent=logo(this.props.name)
  },
  componentDidMount(){
    var svg=this.refs.img.children[0]
    svg.onload=() => { this.updateText() }
  },
  render(){
    const props=this.props

    return (
      <div ref="img" className={`ui imageicon image ${props.className || "tiny"}`}>
        <object data={props.src} type="image/svg+xml"/>
      </div>
    )
  }
})

export default ImageIcon
