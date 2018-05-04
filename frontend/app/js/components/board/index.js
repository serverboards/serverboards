import React from 'react'
import Widget from './widget'
import EditWidget from 'app/containers/board/edit_widget'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import Restricted from 'app/restricted'
import ReactGridLayout from 'react-grid-layout'
import {object_is_equal, to_keywordmap} from 'app/utils'
import {set_modal} from 'app/utils/store'
import rpc from 'app/rpc'
import Empty from './empty'
import moment from 'moment'
import AddButton from 'app/components/project/addbutton'
import {ErrorBoundary, Error} from 'app/components/error'
import i18n from 'app/utils/i18n'
import lo from 'lodash'

require('sass/board.sass')
require('sass/gridlayout.sass')

const RT_INTERVAL = localStorage.dashboard_rt_period || 30
const WIDGET_WIDTH = 160
const WIDGET_GAP = 13.5

function clamp(v, min, max){
  if (v){
    if (v > max)
      v = max
    if (v < min)
      v = min
  }
  else{
    v = min
  }
  return v
}

class Board extends React.Component{
  constructor(props){
    super(props)
    const {configs, to_extract} = this.updateConfigs(props.widgets, false)
    this.calculateBoardSize = this.calculateBoardSize.bind(this)
    // console.log("Configs %o", configs)
    this.state = {
      layout: this.getAllLayouts(this.props),
      update_now_label_timer_id: undefined,
      update_realtime_timer_id: undefined,
      configs,
      to_extract,
      board_width: 2400,
      board_height: 1080,
      board_cols: 16,
      widget_width: WIDGET_WIDTH
    }
  }
  handleEdit(uuid){
    const widget=this.props.widgets.find( (w) => w.uuid == uuid )
    set_modal("dashboard.widget.edit", {uuid, widget})
  }
  handleAddWidget(){
    set_modal('dashboard.widget.create',{project: this.props.project})
  }
  getAllLayouts(props, widget_width){
    widget_width = widget_width || (this.state || {}).widget_width || WIDGET_WIDTH
    const layout = this.props.widgets && this.props.widgets.map( (w) => {
      const template_layout = to_keywordmap((this.getTemplate(w.widget) || {}).hints)

      const ui = {...w.ui, ...template_layout}
      ui.i = w.uuid
      if (!ui)
        return {w: 1, h: 1}

      ui.minW = ui.minW || 1
      ui.maxW = ui.maxW || 24
      ui.minH = ui.minH || 1
      ui.maxH = ui.maxH || 8
      ui.w = clamp(ui.w, ui.minW, ui.maxW)
      ui.h = clamp(ui.h, ui.minH, ui.maxH)

      // Width is the number of w + the gaps - 2 for border
      ui.width = (ui.w * (widget_width + WIDGET_GAP)) - 17

      ui.height = ui.h * widget_width - 30

      return ui
    })
    console.log("Layout is", layout)
    return layout
  }
  handleLayoutChange(layout){
    function layout_data(l){
      return {x: l.x, y: l.y, w: l.w, h: l.h, i: l.i}
    }

    const to_set=layout.map( (l) => {
      l = layout_data(l)
      const prev = layout_data((this.state.layout || []).find( (w) => w.i == l.i ) || {})
      if (object_is_equal(prev, l))
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
    // this.setState({layout})
  }
  componentWillReceiveProps(newprops){
    if (!object_is_equal(this.props.widgets, newprops.widgets)){
      lo.debounce(() => {
        this.setState({ layout: this.getAllLayouts(newprops) })
      })()
    }
    if (this.props.show_sidebar != newprops.show_sidebar){
      lo.debounce(this.calculateBoardSize, 200)()
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
    this.calculateBoardSize()
    window.addEventListener("resize", lo.debounce(this.calculateBoardSize, 200))
  }
  calculateBoardSize(){
    // console.log(this.state.layout)
    // console.log(this.refs.board)
    const maxy = Math.max.apply(Math, this.state.layout.map( l => (l.w + l.x) || 0 ))
    const width = $(this.refs.board).width() - 25 // Some margin too
    let ncols = Math.floor(width / (WIDGET_WIDTH+15))
    // console.log("Max Y is ", maxy, " ncols ", ncols)
    if (ncols < maxy){
      ncols = maxy
    }
    let nwidth = ncols * (WIDGET_WIDTH + 15)
    const widget_width = Math.max(WIDGET_WIDTH, Math.floor((width - ((ncols-1) * 15))  / ncols))

    const board_height = Math.max.apply(Math, this.state.layout.map( l => (l.h + l.y) || 0 )) * widget_width + 60

    console.log("Final ", ncols, width, widget_width, board_height)
    this.setState({
      board_cols: ncols,
      board_width: Math.max(width, nwidth),
      widget_width,
      board_height
    })
    lo.debounce(() => {
      this.setState({ layout: this.getAllLayouts(this.props, widget_width) })
    }, 200)()

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
    window.removeEventListener("window", this.calculateBoardSize)
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
    // console.log(this.state.layout, layout)
    return layout
  }
  render() {
    const state = this.state
    const props = this.props

    const widget_catalog = props.widget_catalog
    const widgets=props.widgets.map( w => ({
      widget: w,
      template: this.getTemplate(w.widget)
    }))
    const configs = state.configs
    if (widgets == undefined){
      return (
        <Loading>Serverboard widget data</Loading>
      )
    }
    //const layout = state.layout || widgets.map( (w) => w.ui )
    //console.log(layout)
    if (widgets.length == 0){
      return (
        <div className="ui centered container" style={{padding: 20}}>
          <Empty/>
          <AddButton project={props.project}/>
        </div>
      )
    }
    const theme = props.config.theme || "light"

    const {board_width, board_cols, widget_width} = state

    return (
      <div ref="board" className={`ui board ${theme} with scroll`} style={{minHeight: state.board_height}}>
        <div className="ui padding" style={{width: board_width}}>
          <ReactGridLayout
            className="ui cards layout"
            cols={board_cols}
            rowHeight={widget_width}
            width={board_width}
            margin={[15,0]}
            draggableHandle=".ui.top.mini.menu .ui.header"
            layout={state.layout}
            isDraggable={props.can_edit}
            isResizable={props.can_edit}
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
                          project={props.project}
                          layout={this.getLayout(widget.uuid)}
                          theme={theme}
                          />
                      </ErrorBoundary>
                    </div>
                )
              })}
          </ReactGridLayout>
        </div>
        <AddButton project={props.project}/>
      </div>
    )
  }
}

export default Board
