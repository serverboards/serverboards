import React from 'react'
import Widget from './widget'
import EditWidget from 'app/containers/board/edit_widget'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import Restricted from 'app/restricted'
import ReactGridLayout from 'react-grid-layout'
import {object_is_equal} from 'app/utils'
import {set_modal} from 'app/utils/store'
import rpc from 'app/rpc'
import Empty from './empty'
import moment from 'moment'
import AddButton from 'app/components/project/addbutton'
import {ErrorBoundary, Error} from 'app/components/error'
import i18n from 'app/utils/i18n'

require('sass/board.sass')
require('sass/gridlayout.sass')

const RT_INTERVAL = localStorage.dashboard_rt_period || 30

class Board extends React.Component{
  handleEdit(uuid){
    const widget=this.props.widgets.find( (w) => w.uuid == uuid )
    set_modal("dashboard.widget.edit", {uuid, widget})
  }
  handleAddWidget(){
    set_modal('dashboard.widget.create',{project: this.props.project})
  }
  getAllLayouts(props){
    const layout = this.props.widgets && this.props.widgets.map( (w) => w.ui ).filter( Boolean )
    return layout
  }
  constructor(props){
    super(props)
    const {configs, to_extract} = this.updateConfigs(props.widgets, false)
    // console.log("Configs %o", configs)
    this.state = {
      layout: this.getAllLayouts(this.props),
      update_now_label_timer_id: undefined,
      update_realtime_timer_id: undefined,
      configs,
      to_extract
    }
  }
  handleLayoutChange(layout){
    const to_set=layout.map( (l) => {
      const prev = (this.state.layout || []).find( (w) => w.i == l.i ) || {}
      if (object_is_equal(prev,l))
        return false
      return l
    }).filter( Boolean ).map( w => ({
      i: w.i,
      x: w.x, y: w.y,
      h: w.h, w: w.w
    }) )
    Promise.all( to_set.map( (w) => {
      rpc.call("dashboard.widget.update", {uuid: w.i, ui: w})
    }) ).catch( e => {
      console.log("Could not change layout", e)
    })
    this.setState({layout})
  }
  componentWillReceiveProps(newprops){
    if (!object_is_equal){
      const layout = this.getLayout(newprops)
      this.setState({ layout })
    }
    if (newprops.realtime != this.props.realtime){
      if (newprops.realtime){
        const update_realtime_timer_id = setInterval(this.updateRealtime.bind(this), RT_INTERVAL * 1000)
        this.setState({update_realtime_timer_id})
      }
      else{
        clearInterval(this.state.update_realtime_timer_id)
        this.setState({update_realtime_timer_id: undefined})
      }
    }
    if (!newprops.realtime && !object_is_equal(newprops.time_slice, this.props.time_slice)){
      console.log("Changed period! NO RT", newprops)
      const context = this.getStatusContext(newprops.time_slice)
      const {configs, to_extract} = this.updateConfigs(newprops.widgets)
      this.setState({configs, to_extract})
      this.updateExtractedConfigs(to_extract, context)
    }
    // console.log("New props: ", this.props.widgets, newprops.widgets)
    if (!object_is_equal(this.props.widgets, newprops.widgets)){
      const {configs, to_extract} = this.updateConfigs(newprops.widgets)
      this.setState({configs, to_extract})
      this.updateExtractedConfigs(to_extract, this.getStatusContext())
    }
  }
  componentDidMount(){
    this.updateExtractedConfigs(this.state.to_extract, this.getStatusContext())

    let self=this
    Command.add_command_search('add-widget',(Q, context) => [
      {id: 'add-widget', title: 'Add Widget', description: 'Add a widget to this board', run: this.handleAddWidget }
    ], 2)
    this.setState({
      update_now_label_timer_id: setInterval(() => this.props.updateDaterangeNow(), 60 * 1000)
    })
    // jquery hack, may be better using some property at redux
    $('#centralarea').addClass("grey background")
    if (this.props.realtime){
      const update_realtime_timer_id = setInterval(this.updateRealtime.bind(this), RT_INTERVAL * 1000)
      this.setState({update_realtime_timer_id})
    }
  }
  updateConfigs(widgets){
    let configs = {}
    let to_extract = []
    for (const w of widgets){
      const template = this.getTemplate(w.widget)
      let config = {}
      for (const p of ((template || {}).params || [])){
        let k = p.name
        if (p.type=="query"){
          config[k] = {loading: true}
          to_extract.push(w.uuid)
        }
        else
          config[k] = w.config[k]
      }

      configs[w.uuid] = config
    }
    to_extract = Array.from(new Set(to_extract)) // remove dups

    return {configs, to_extract}
  }
  getStatusContext(time_slice){
    if (!time_slice)
      time_slice = this.props.time_slice
    const start = time_slice[0]
    const end = time_slice[1]
    const secs = moment(end).diff(start, 'seconds')
    const prev = moment(start).subtract(secs, "seconds")

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      prev: prev.toISOString()
    }
  }
  updateExtractedConfigs(to_extract, context){
    // console.log("To extract ", to_extract)
    console.log("Update in range", context)
    to_extract.map( uuid => {
      rpc.call("dashboard.widget.extract", [uuid, context]).then( result => {
        let configs = {...this.state.configs}
        configs[uuid] = result
        this.setState({configs})
      })
    })
  }
  getTemplate(type){
    return this.props.widget_catalog.find( t => t.id == type )
  }
  componentWillUnmount(){
    Command.remove_command_search('add-widget')
    clearInterval(this.state.update_now_label_timer_id)
    if (this.state.update_realtime_timer_id)
      clearInterval(this.state.update_realtime_timer_id)
    // jquery hack, may be better using some property at redux
    $('#centralarea').removeClass("grey").removeClass("background")
  }
  updateRealtime(){
    const end = moment()
    const secs = moment(this.props.time_slice[1]).diff(this.props.time_slice[0], 'seconds')
    const start = moment(end).subtract(secs, "seconds")
    const prev = moment(start).subtract(secs, "seconds")

    this.updateExtractedConfigs(this.state.to_extract, {
      start: start.toISOString(),
      end: end.toISOString(),
      prev: prev.toISOString()
    })
    this.props.updateDaterange(start, end)
  }
  getLayout(wid){
    let layout = this.state && (this.state.layout || []).find( l => l.i == wid )
    if (!layout)
      layout={x:0, y:0, h: 2, w: 2, minW: 1, minH: 1, maxW: 20, maxH: 20}
    layout = {...layout, width: layout.w * 132 + (layout.w - 1) * 17, height: layout.h*163 - 28}
    return layout
  }
  render() {
    const widget_catalog = this.props.widget_catalog
    const widgets=this.props.widgets.map( w => ({
      widget: w,
      template: this.getTemplate(w.widget)
    }))
    const configs = this.state.configs
    if (widgets == undefined){
      return (
        <Loading>Serverboard widget data</Loading>
      )
    }
    //const layout = this.state.layout || widgets.map( (w) => w.ui )
    //console.log(layout)
    if (widgets.length == 0){
      return (
        <div className="ui centered container" style={{padding: 20}}>
          <Empty/>
          <AddButton project={this.props.project}/>
        </div>
      )
    }
    const theme = this.props.config.theme || "light"

    return (
      <div className={`ui board ${theme} with scroll`}>
        <div className="ui padding">
          <ReactGridLayout
            className="ui cards layout"
            cols={16}
            rowHeight={163}
            width={2400}
            margin={[15,0]}
            draggableHandle=".ui.top.mini.menu .ui.header"
            layout={this.state.layout}
            isDraggable={this.props.can_edit}
            isResizable={this.props.can_edit}
            onLayoutChange={this.handleLayoutChange.bind(this)}
            >
              {widgets.map( ({widget, template}) => {
                return (
                    <div
                      key={widget.uuid}
                      data-grid={{x:0, y: 0, w: 1, h: 1, ...((template || {}).hints || {}), ...(widget.ui || {} )}}
                      className="ui card"
                      >
                      <ErrorBoundary key={widget.uuid} error={i18n("Fatal error rendering widget {type}", {type: widget.widget})}>
                        <Widget
                          key={widget.uuid}
                          widget={widget.widget}
                          config={configs[widget.uuid] || {}}
                          uuid={widget.uuid}
                          template={template}
                          onEdit={() => this.handleEdit(widget.uuid)}
                          project={this.props.project}
                          layout={this.getLayout(widget.uuid)}
                          theme={theme}
                          />
                      </ErrorBoundary>
                    </div>
                )
              })}
          </ReactGridLayout>
        </div>
        <AddButton project={this.props.project}/>
      </div>
    )
  }
}

export default Board
