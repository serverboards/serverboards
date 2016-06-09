import React from 'react'

require("sass/console.sass")

function ConsoleLine(props){
  return (
    <div className="line">
      <pre className={props.line.highlight}>{props.line.text}</pre>
    </div>
  )
}

var Console=React.createClass({
  getInitialState:function(){
    return { stick_to_bottom: true }
  },
  handleSubmit: function(ev){
    ev.preventDefault()

    var inpt=$(ev.target).find('input')
    this.props.onSubmit(inpt.val())
    inpt.val('')
  },
  onToggle: function(ev){
    if (ev.keyCode==186){
      console.debug("Toggle RPC console")
      ev.preventDefault()
      console.log(this)
      if (this.props.show)
        this.props.onHide()
      else{
        this.props.onShow()
        $('.top.console input').focus()
      }
    }
  },
  componentDidMount(){
    $(window).on('keypress', this.onToggle)

    return {}
  },
  componentWillUnmount(){
    $(window).off('keypress', this.onToggle)
  },
  componentWillUpdate(){
    if (this.state.stick_to_bottom){
      let history=$('.top.console .history')
      if (history.length){
        var top=history.scrollTop() + history.find('.line:last').offset().top
        history.animate({
          scrollTop: top
        }, 200)
      }
    }
  },
  render(){
    var props=this.props
    //console.log(props)
    if (!this.props.show)
      return (
        <div/>
      )

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
