import React from 'react'

require("../../sass/console.sass")

function ConsoleLine(props){
  return (
    <div className="line">
      <pre className={props.line.highlight}>{props.line.text}</pre>
    </div>
  )
}

var Console=React.createClass({
  handleSubmit: function(ev){
    ev.preventDefault()

    var inpt=$(ev.target).find('input')
    this.props.onSubmit(inpt.val())
    inpt.val('')
  },
  render: function(){
    var props=this.props

    var lines=props.lines.map(function(l){
      return (
        <ConsoleLine key={l.id} line={l}/>
      )
    })
    return (
      <div className="top console">
        <div className="history">
          {lines}
        </div>
        <hr/>
        <div className="prompt">
          <form onSubmit={this.handleSubmit}>
            <span>&gt;&gt;&gt; </span>
            <input type="text"/>
          </form>
        </div>
      </div>
    )
  }
})

export default Console
