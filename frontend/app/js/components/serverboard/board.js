import React from 'react'
import plugin from 'app/utils/plugin'

const Widget = React.createClass({
  umount: undefined,
  componentDidMount(){
    plugin.load(`${this.props.id}.js`).then( () => {
      this.umount=plugin.do_widget(this.props.id, this.refs.el, this.props.config)
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

const Board = React.createClass({
  render(){
    const widgets=[
      {id: "serverboards.core.widgets/clock", config:{}, uuid: 1},
      {id: "serverboards.core.widgets/clock", config:{}, uuid: 2},
      {id: "serverboards.core.widgets/clock", config:{}, uuid: 3},
    ]
    return (
      <div className="ui cards">
        {widgets.map( (w) => (
          <Widget key={w.uuid} id={w.id} config={w.config}/>
        ))}
      </div>
    )
  }
})

export default Board
