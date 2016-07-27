import React from 'react'
import plugin from 'app/utils/plugin'

const Widget = React.createClass({
  umount: undefined,
  componentDidMount(){
    plugin.load(`${this.props.widget}.js`).then( () => {
      this.umount=plugin.do_widget(this.props.widget, this.refs.el, this.props.config)
    })
  },
  componentWillUnmount(){
    this.umount && this.umount()
  },
  render(){
    const config = this.props.config
    return (
      <div className="card">
        <div style={{flexGrow:1}} ref="el"/>
        <a style={{textAlign: "right", color:"#bbb"}} onClick={this.props.onEdit}>
          Edit <i className="ui icon edit"/>
        </a>
      </div>
    )
  }
})

export default Widget
