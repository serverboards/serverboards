import React from 'react'
import Widget from './widget'
import EditWidget from 'app/containers/board/edit_widget'
import Loading from 'app/components/loading'
import Command from 'app/utils/command'
import Restricted from 'app/restricted'
import ReactGridLayout from 'react-grid-layout'
import {object_is_equal, to_keywordmap, map_get} from 'app/utils'
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
    this.updateLayout = this.updateLayout.bind(this)
    this.refreshWidgets = this.refreshWidgets.bind(this)
    // console.log("Configs %o", configs)
    this.state = {
      layout: this.getAllLayouts(this.props),
      update_now_label_timer_id: undefined,
      configs,
      to_extract,
      board_width: 2400,
      board_height: 1080,
      board_cols: 16,
      board_rows: 5,
      widget_width: WIDGET_WIDTH,
      fullscreen: false,
      timers: [],
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
    const layout = this.props.widgets && this.props.widgets.map( (w, idx) => this.getDefaultLayout(w, idx, widget_width))
    // console.log("Layout is", layout)
    return layout
  }
  getDefaultLayout(widget, y, widget_width){
    const template_layout = to_keywordmap((this.getTemplate(widget.widget) || {}).hints)

    const ui = {x: 0, y, ...template_layout, ...(widget.ui || {})}
    ui.i = widget.uuid

    ui.minW = ui.minW || 1
    ui.maxW = ui.maxW || 24
    ui.minH = ui.minH || 1
    ui.maxH = ui.maxH || 8
    ui.w = clamp(ui.w, ui.minW, ui.maxW)
    ui.h = clamp(ui.h, ui.minH, ui.maxH)

    // Width is the number of w + the gaps - 2 for border
    ui.width = (ui.w * (widget_width + WIDGET_GAP)) - 17

    ui.height = ui.h * widget_width - 30
    ui.widget_width = widget_width

    return ui
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

    //lo.debounce(this.updateLayout, 200)
    // this.setState({layout})
  }
  componentWillReceiveProps(newprops){
    // console.log("Got new props", this.props, newprops)
    if (!object_is_equal(this.props.widgets, newprops.widgets)){
      // console.log("update layout")
      lo.debounce(this.updateLayout, 200)()
    }
    if (this.props.show_sidebar != newprops.show_sidebar){
      // console.log("calculate board size")
      lo.debounce(this.calculateBoardSize, 200)()
    }

    if (newprops.time_range != this.props.time_range){
      this.updateDaterangeInterval(newprops)
    }

    // console.log("new tr", newprops, "old tr", this.props)
    if ((newprops.realtime != this.props.realtime) || !object_is_equal(newprops.time_slice, this.props.time_slice)){
      // console.log("Changed period or RT", newprops)
      this.refreshWidgets(newprops)
    }
    // console.log("New props: ", this.props.widgets, newprops.widgets)
    if (!object_is_equal(this.props.widgets, newprops.widgets)){
      console.log("refresh widgets")
      lo.debounce(this.updateLayout, 200)()
      lo.debounce(this.refreshWidgets, 200)()
    }
  }
  refreshWidgets(props){
    props = props || this.props
    // If range change, its a full refresh. Else its not. There will be failires, but okish.
    const is_refresh = (props.time_range != this.props.time_range)
    // console.log("Is a refresh?", is_refresh)
    const {configs, to_extract} = this.updateConfigs(props.widgets, is_refresh)
    this.setState({configs, to_extract})
    this.updateExtractedConfigs(to_extract, this.getStatusContext(props))
  }
  componentDidMount(){
    this.updateExtractedConfigs(this.state.to_extract, this.getStatusContext())
    this.setupPollingWidgets()

    let self=this
    Command.add_command_search('add-widget',(Q, context) => [
      {id: 'add-widget', title: 'Add Widget', description: 'Add a widget to this board', run: this.handleAddWidget }
    ], 2)
    this.updateDaterangeInterval()
    // jquery hack, may be better using some property at redux
    $('#centralarea').addClass("grey background")
    this.calculateBoardSize()
    window.addEventListener("resize", lo.debounce(this.calculateBoardSize, 200))
  }
  setupPollingWidgets(){
    const all_configs = map_get(this, ["state", "configs"], {})
    const widgets = this.props.widgets
    let timers = this.state.timers || {}

    for (const w of widgets){
      const template = this.getTemplate(w.widget)
      let config = {...map_get(all_configs, [w.uuid], {})}
      for (const p of ((template || {}).params || [])){
        let k = p.name
        const query = w.config[k]
        let poll = query ? query.startsWith('POLL ') : false
        if (poll){
          let t =  Number(query.substr(5).trim().split(/[\n\t ]/)[0]) * 1000
          // console.log("Poll timer: ", query.substr(5).trim().split(" ")[0], t)

          // FIXME: A widget with several queries clears and set the intervals several times. One query with polling affects all data
          let uuid = w.uuid
          if (timers[uuid]){
            // console.log("Clear timer", timers[uuid])
            clearInterval(timers[uuid])
          }
          if (!isNaN(t)){
            timers[uuid] = setInterval(() => this.updateWidgetData(uuid), t)
            // console.log("Add timer", timers[uuid], t)
          }
        }
      }
    }

    this.setState({timers})
  }
  updateDaterangeInterval(props){
    if (this.state.update_now_label_timer_id)
      clearInterval(this.state.update_now_label_timer_id)

    const tr = (props || this.props).time_range
    const interval = this.getInterval(tr)
    console.log("Will reload dashboard in ", interval, " seconds")

    const update_now_label_timer_id = setInterval(this.props.updateDaterangeNow, interval * 1000)
    this.setState({update_now_label_timer_id})
  }
  getInterval(tr){
    const seconds = 1
    const minutes = 60 * seconds
    const hours = 60 * minutes
    const days = 24 * hours

    if (tr < (2*hours))
      return 30 * seconds
    if (tr < (12 * hours))
      return 1 * minutes
    if (tr < (2 * days))
      return 30 * minutes
    if (tr < (7 * days))
      return 1 * hours
    return 6 * hours
  }
  calculateBoardSize(){
    // console.log(this.state.layout)
    // console.log(this.refs.board)
    const maxy = Math.max.apply(Math, this.state.layout.map( l => (l.w + l.x) || 0 ))
    const width = Math.max(500, $(this.refs.board).width() - 25) // Some margin too
    let ncols = Math.floor(width / (WIDGET_WIDTH+15))
    // console.log("Max Y is ", maxy, " ncols ", ncols)
    const fullscreen = (window.innerHeight == screen.height)
    if (fullscreen || (ncols < maxy)){
      ncols = maxy
    }
    let board_width = Math.max(
      ncols * (WIDGET_WIDTH + 15),
      width
    )
    const widget_width = Math.max(WIDGET_WIDTH, Math.floor((width - ((ncols-1) * 15))  / ncols))

    const height = $(this.refs.board).height() - 25 // Some margin too
    const nrows = Math.max.apply(Math, this.state.layout.map( l => (l.h + l.y) || 0 ))
    const board_height = Math.max(
      nrows * widget_width + 60,
      height
    )

    // console.log("Final ", ncols, width, widget_width, board_height)
    this.setState({
      board_cols: ncols,
      board_rows: nrows,
      board_width,
      widget_width,
      board_height,
      fullscreen
    })
    lo.debounce(this.updateLayout, 400)()
  }
  updateLayout(){
    this.setState({ layout: this.getAllLayouts(this.props) })
  }
  updateConfigs(widgets, is_refresh){
    let configs = {}
    let to_extract = []
    const all_configs = is_refresh ? {} : map_get(this, ["state", "configs"], {})

    for (const w of widgets){
      const template = this.getTemplate(w.widget)
      let config = {...map_get(all_configs, [w.uuid], {})}
      for (const p of ((template || {}).params || [])){
        let k = p.name
        if (p.type=="query"){
          // if no prev config, set loading
          if (!config[k]){
            config[k] = {loading: true}
          }
          else{
            config[k].stale = true
          }
          to_extract.push(w.uuid)
        }
        else
          config[k] = w.config[k]
      }
      // console.log("Get config from ", {...config})

      configs[w.uuid] = config
    }
    to_extract = Array.from(new Set(to_extract)) // remove dups

    return {configs, to_extract}
  }
  getStatusContext(props){
    props = props || this.props

    const time_slice = props.time_slice
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
    // console.log("Update in range", context)
    to_extract.map( (uuid) => this.updateWidgetData(uuid, context) )
  }
  updateWidgetData(uuid, context){
    if (!context)
      context = this.getStatusContext()
    // console.log("Update widget ", uuid, context)
    rpc.call("dashboard.widget.extract", [uuid, context]).then( result => {
      let configs = {...this.state.configs}
      configs[uuid] = result
      this.setState({configs})
    })
  }
  getTemplate(type){
    return this.props.widget_catalog.find( t => t.id == type )
  }
  componentWillUnmount(){
    Command.remove_command_search('add-widget')
    clearInterval(this.state.update_now_label_timer_id)
    // jquery hack, may be better using some property at redux
    $('#centralarea').removeClass("grey").removeClass("background")
    window.removeEventListener("window", this.calculateBoardSize)
    Object.values(this.state.timers).map( v => clearInterval(v) )
  }
  getLayout(widget){
    const wid = widget.uuid
    let layout = this.state && (this.state.layout || []).find( l => l.i == wid )
    // console.log(this.state.layout, layout)
    if (!layout){ // It happens on new widgets, just add no layout set yet by react-grid-layout
      layout = this.getDefaultLayout(widget, 0, this.state.widget_width)
    }
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

    const {board_width, board_height, board_cols, board_rows, widget_width} = state

    const board_style = {
      alignItems: (state.fullscreen || (board_rows >= 4)) ? "center" : "flex-start",
      justifyItems: "center"
    }

    return (
      <div ref="board" className={`ui board ${theme} with scroll`} style={board_style}>
        <div className="ui padding" style={{width: board_width, maxHeight: "100%"}}>
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
                          layout={this.getLayout(widget)}
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
