import React from 'react'

// Tweaks for speed, first milliseconds per tick
let hold_speed=100
// Second increment on each tick. At 100 it sends onClick.
let hold_speed2=5

let ProgressBar=function(props){
  return (
    <div className="ui bottom attached progress" style={{background: "#DB2828!important", marginTop: -3, marginRight: 4}}>
      <div className="bar" style={{minWidth: 0, width: `${props.fill}%`, background: "red"}}/>
    </div>
  )
}

let HoldButton = React.createClass({
  getInitialState : function(){
    return {
      count: 0
    }
  },
  handleClick : function(){
    this.props.onClick()
  },
  componentDidMount : function(){
    let $button=$(this.refs.button)
    $button
      .on('mousedown', this.startHold)
      .on('mouseup', this.stopHold)
      .on('mouseleave', this.stopHold)
  },
  startHold : function(ev){
    if (this.timer)
      return
    if (ev.which==1)
      this.timer=setTimeout(this.countHold, hold_speed)
  },
  countHold : function(){
    if (this.state.count>=100){
      this.stopHold()
      this.handleClick()
    }
    else{
      this.setState({count: this.state.count+hold_speed2})
      this.timer=setTimeout(this.countHold, hold_speed)
    }
  },
  stopHold : function(){
    this.setState({count: 0})
    clearTimeout(this.timer)
    this.timer=undefined
  },
  render: function(){
    return (
      <div style={{display: "inline-block", verticalAlign: "bottom", marginLeft: 10}}>
        <button ref="button" className={this.props.className} type={this.props.type}>
          {this.props.children}
        </button>
        <ProgressBar fill={this.state.count}/>
      </div>
    )
  }
})

export default HoldButton
