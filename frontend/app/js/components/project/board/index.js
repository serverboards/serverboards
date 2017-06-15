import React from 'react'
import Widget from 'app/containers/project/board/widget'
import AddWidget from 'app/containers/project/board/add_widget'
import EditWidget from 'app/containers/project/board/edit_widget'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import Restricted from 'app/restricted'
import ReactGridLayout from 'react-grid-layout'
import {object_is_equal} from 'app/utils'
import {set_modal} from 'app/utils/store'
import rpc from 'app/rpc'
import Empty from './empty'
import moment from 'moment'

require('sass/board.sass')
require('sass/gridlayout.sass')

const RT_INTERVAL = 30

const Board = React.createClass({
  handleEdit(uuid){
    const widget=this.props.widgets.find( (w) => w.uuid == uuid )
    set_modal("dashboard.widget.edit", {uuid, widget})
  },
  handleAddWidget(){
    set_modal('dashboard.widget.create',{project: this.props.project})
  },
  getLayout(props){
    const layout = this.props.widgets && this.props.widgets.map( (w) => w.ui ).filter( Boolean )
    return layout
  },
  getInitialState(){
    return {
      layout: this.getLayout(this.props),
      update_now_label_timer_id: undefined,
      update_realtime_timer_id: undefined,
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
      rpc.call("dashboard.widget.update", {uuid: w.i, ui: w})
    })
    this.setState({layout})
  },
  componentWillReceiveProps(newprops){
    if (!object_is_equal){
      const layout = this.getLayout(newprops)
      this.setState({ layout })
    }
    if (newprops.realtime != this.props.realtime){
      if (newprops.realtime){
        const update_realtime_timer_id = setInterval(this.updateRealtime, RT_INTERVAL * 1000)
        this.setState({update_realtime_timer_id})
      }
      else{
        clearInterval(this.state.update_realtime_timer_id)
        this.setState({update_realtime_timer_id: undefined})
      }
    }
  },
  componentDidMount(){
    let self=this
    Command.add_command_search('add-widget',(Q, context) => [
      {id: 'add-widget', title: 'Add Widget', description: 'Add a widget to this board', run: this.handleAddWidget }
    ], 2)
    this.setState({
      update_now_label_timer_id: setInterval(() => this.props.updateDaterangeNow(), 60 * 1000)
    })
    // jquery hack, may be better using some property at redux
    $('.ui.central.with.menu.white.background').removeClass("white").addClass("grey")
    if (this.props.realtime){
      const update_realtime_timer_id = setInterval(this.updateRealtime, RT_INTERVAL * 1000)
      this.setState({update_realtime_timer_id})
    }
  },
  componentWillUnmount(){
    Command.remove_command_search('add-widget')
    clearInterval(this.state.update_now_label_timer_id)
    if (update_realtime_timer_id)
      clearInterval(update_realtime_timer_id)
    // jquery hack, may be better using some property at redux
    $('.ui.central.with.menu.grey.background').removeClass("grey").addClass("white")
  },
  updateRealtime(){
    const end = moment()
    const secs = moment(this.props.time_slice[1]).diff(this.props.time_slice[0], 'seconds')
    const start = moment(end).subtract(secs, "seconds")
    this.props.updateDaterange(start, end)
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
      <div className={(widgets.length == 0) ? "ui centered container" : ""} style={{padding: 20}}>
        {(widgets.length == 0) ? (
          <Empty/>
        ) : (
          <div className="ui board">
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
          </div>
          )}
        <Restricted perm="dashboard.widget.create">
          <a onClick={this.handleAddWidget} className="ui massive button _add icon floating teal">
            <i className="add icon"></i>
          </a>
        </Restricted>
      </div>
    )
  }
});

export default Board
