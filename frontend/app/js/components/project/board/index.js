import React from 'react'
import Widget from 'app/containers/project/board/widget'
import AddWidget from 'app/containers/project/board/add_widget'
import EditWidget from 'app/containers/project/board/edit_widget'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import BoardHeader from './header'
import Restricted from 'app/restricted'
import ReactGridLayout from 'react-grid-layout'
import {object_is_equal} from 'app/utils'
import {set_modal} from 'app/utils/store'
import rpc from 'app/rpc'

require('sass/board.sass')
require('sass/gridlayout.sass')

const Board = React.createClass({
  handleEdit(uuid){
    const widget=this.props.widgets.find( (w) => w.uuid == uuid )
    set_modal("project.widget.edit", {uuid, widget})
  },
  handleAddWidget(){
    set_modal('project.widget.add',{project: this.props.project})
  },
  getLayout(props){
    const layout = this.props.widgets && this.props.widgets.map( (w) => w.ui ).filter( Boolean )
    return layout
  },
  getInitialState(){
    return {
      layout: this.getLayout(this.props),
      interval_id: undefined,
    }
  },
  handleLayoutChange(layout){
    const to_set=layout.map( (l) => {
      const prev = (this.state.layout || []).find( (w) => w.i == l.i ) || {}
      if (object_is_equal(prev,l))
        return false
      return l
    }).filter( Boolean )
    to_set.map( (w) => {
      rpc.call("project.widget.update", {uuid: w.i, ui: w})
    })
    this.setState({layout})
  },
  componentWillReceiveProps(newprops){
    if (!object_is_equal){
      const layout = this.getLayout(newprops)
      this.setState({ layout })
    }
  },
  componentDidMount(){
    let self=this
    Command.add_command_search('add-widget',(Q, context) => [
      {id: 'add-widget', title: 'Add Widget', description: 'Add a widget to this board', run: this.handleAddWidget }
    ], 2)
    this.setState({
      interval_id: setInterval(() => this.props.updateDaterangeNow(), 60 * 1000)
    })
  },
  componentWillUnmount(){
    Command.remove_command_search('add-widget')
    clearInterval(this.state.interval_id)
  },
  getLayout(wid){
    const layout = this.state && (this.state.layout || []).find( l => l.i == wid )
    if (layout)
      return {width: layout.w, height: layout.h}
    return undefined
  },
  render() {
    const widgets=this.props.widgets
    if (widgets == undefined){
      return (
        <Loading>Serverboard widget data</Loading>
      )
    }
    //const layout = this.state.layout || widgets.map( (w) => w.ui )
    //console.log(layout)
    return (
      <div className="ui board">
        <BoardHeader/>
        <ReactGridLayout
          className="ui cards layout"
          cols={8}
          rowHeight={280}
          width={2400}
          margin={[15,15]}
          draggableHandle=".ui.top.mini.menu .ui.header"
          layout={this.state.layout}
          onLayoutChange={this.handleLayoutChange}
          >
            {widgets.map( (w) => (
              <div
                key={w.uuid}
                data-grid={w.ui}
                className="ui card"
                >
                <Widget
                  key={w.uuid}
                  widget={w.widget}
                  config={w.config}
                  uuid={w.uuid}
                  onEdit={() => this.handleEdit(w.uuid)}
                  project={this.props.project}
                  layout={this.getLayout(w.uuid)}
                  />
              </div>
            ))}
        </ReactGridLayout>
        <Restricted perm="project.widget.add">
          <a onClick={this.handleAddWidget} className="ui massive button _add icon floating yellow">
            <i className="add icon"></i>
          </a>
        </Restricted>
      </div>
    )
  }
});

export default Board
