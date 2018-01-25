import React from 'react'
import Widget from './widget'
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
import AddButton from 'app/components/project/addbutton'

require('sass/board.sass')
require('sass/gridlayout.sass')

const RT_INTERVAL = 5

class Board extends React.Component{
  handleEdit(uuid){
    const widget=this.props.widgets.find( (w) => w.uuid == uuid )
    set_modal("dashboard.widget.edit", {uuid, widget})
  }
  handleAddWidget(){
    set_modal('dashboard.widget.create',{project: this.props.project})
  }
  getLayout(props){
    const layout = this.props.widgets && this.props.widgets.map( (w) => w.ui ).filter( Boolean )
    return layout
  }
  constructor(props){
    super(props)
    const configs = this.updateConfigs(props.widgets, false)
    console.log("Configs %o", configs)
    this.state = {
      layout: this.getLayout(this.props),
      update_now_label_timer_id: undefined,
      update_realtime_timer_id: undefined,
      configs
    }
  }
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
    // console.log("New props: ", this.props.widgets, newprops.widgets)
    if (!object_is_equal(this.props.widgets, newprops.widgets)){
      const configs = this.updateConfigs(newprops.widgets, true)
    }
  }
  componentDidMount(){
    const config = this.updateConfigs(this.props.widgets, true)

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
  updateConfigs(widgets, update_state){ // update state is use ONLY to get the state first time (constructor)
    let configs = {}
    let to_extract = []
    for (const w of widgets){
      const template = this.getTemplate(w.widget)
      let config = {}
      for (const p of (template.params || [])){
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
    if (!update_state) // no side effects, simple basic config only
      return configs
    // console.log("To extract ", to_extract)
    if (to_extract.length > 0){
      to_extract = Array.from(new Set(to_extract)) // remove dups
      rpc.call("dashboard.widget.extract", to_extract).then( results => {
        configs = {...this.state.configs}
        for (let i in results){
            configs[to_extract[i]] = results[i]
        }
        this.setState({configs})
      })
    }
    this.setState({configs})
    return configs
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
    this.props.updateDaterange(start, end)
  }
  getLayout(wid){
    const layout = this.state && (this.state.layout || []).find( l => l.i == wid )
    if (layout)
      return {width: layout.w, height: layout.h}
    return undefined
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
    return (
      <div className={(widgets.length == 0) ? "ui centered container" : ""} style={{padding: 20}}>
        {(widgets.length == 0) ? (
          <Empty/>
        ) : (
          <div className="ui board">
            <ReactGridLayout
              className="ui cards layout"
              cols={8}
              rowHeight={130}
              width={2400}
              margin={[15,0]}
              draggableHandle=".ui.top.mini.menu .ui.header"
              layout={this.state.layout}
              onLayoutChange={this.handleLayoutChange.bind(this)}
              >
                {widgets.map( ({widget, template}) => (
                  <div
                    key={widget.uuid}
                    data-grid={{x:0, y: 0, w: 1, h: 1, ...widget.ui, ...template.hints}}
                    className="ui card"
                    >
                    <Widget
                      key={widget.uuid}
                      widget={widget.widget}
                      config={configs[widget.uuid] || {}}
                      uuid={widget.uuid}
                      template={template}
                      onEdit={() => this.handleEdit(widget.uuid)}
                      project={this.props.project}
                      layout={this.getLayout(widget.uuid)}
                      />
                  </div>
                ))}
            </ReactGridLayout>
          </div>
          )}
        <AddButton project={this.props.project}/>
      </div>
    )
  }
}

export default Board
