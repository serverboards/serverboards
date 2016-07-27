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
    console.log("Widget umount %o", this.umount)
    this.umount && this.umount()
  },
  render(){
    const config = this.props.config
    return (
      <div className="card" ref="el"/>
    )
  }
})

export default Widget
