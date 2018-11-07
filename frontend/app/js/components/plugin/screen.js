import React from 'react'
import plugin from 'app/utils/plugin'
import Loading from '../loading'
import {merge, to_keywordmap, match_traits, map_get} from 'app/utils'
import PropTypes from 'prop-types';
import {SectionMenu} from 'app/components'
import store from 'app/utils/store'
import i18n from 'app/utils/i18n'
import {ErrorBoundary} from 'app/components/error'
import Tip from 'app/components/tip'

const empty_box_img = require('imgs/026-illustration-nocontent.svg')

const plugin_load = plugin.load
const plugin_do_screen = plugin.do_screen

function SelectService(props){
  const services = props.services || []
  const uuid = props.selected && props.selected.uuid

  return (
    <div className="menu">
      <div style={{width: 30}}/>
      <div className="ui attached tabular menu">
        {services.length > 0 ? services.map( s => (
          <a key={s.uuid} className={`item ${s.uuid == uuid ? "active" : ""}`} onClick={() => props.onService(s.uuid)}>
            {s.name}
          </a>
        )) : (
          <h3 className="ui red header">{i18n("No services for this screen. Create one.")}</h3>
        )}
      </div>
    </div>
  )
}


class ExternalScreen extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      umount: undefined,
      service: props.service,
      component: undefined,
    }
  }
  componentWillUnmount(){
    if (this.state.umount){
      this.state.umount()
      $(this.refs.el).html('')
    }
  }
  componentDidMount(){
    this.reloadScreen()
  }
  reloadScreen(){
    this.componentWillUnmount()
    const {props, state} = this
    const plugin = props.plugin
    const component = props.component

    const context = {
      plugin_id: plugin,
      component_id: component,
      screen_id: `${plugin}/${component}`
    }

    const load_js = () => {
      if (this.state.cleanupf){
        this.state.cleanupf() // Call before setting a new one
        this.setState({cleanupf(){}})
      }
      const plugin_js=`${plugin}/${component}.js`
      const pprops = {
        ...(props.data || this.props.location.state),
        ...props,
        project: props.project,
        service: state.service
      }
      const el = this.refs.el

      plugin_load(plugin_js).then(() =>
        plugin_do_screen(`${plugin}/${component}`, el, pprops, context)
      ).then( ({umount, component}) => {
        this.setState({umount, component})
      }).catch( (e) => {
        console.warn("Could not load JS %o: %o", plugin_js, e)
      })

    }
    $(this.refs.el)
      .attr('data-pluginid', plugin)
      .attr('data-screenid', `${plugin}/${component}`)

    const hints = to_keywordmap(map_get(this.props, ["screen", "extra", "hints"], []))
    const plugin_html = `${plugin}/${component}.html`
    const plugin_css = `${plugin}/${component}.css`
    // console.log("Screen hints", hints, this.props)
    Promise.all([
      !hints["nohtml"] && plugin_load(plugin_html,  {base_url: plugin}),
      !hints["nocss"] && plugin_load(plugin_css,  {base_url: plugin})
    ]).then( (html) => {
      $(this.refs.el).html(html)
      load_js()
    }).catch( (e) => {
      console.warn("Could not load HTML %o: %o", plugin_html, e)
      $(this.refs.el).html('')
      load_js()
    })
  }
  handleService(current){
    const service = this.props.services.find( s => s.uuid == current )
    this.setState({current, service}, this.reloadScreen.bind(this))
  }
  componentWillReceiveProps(newprops){
    const nuuid = newprops.service && newprops.service.uuid
    const puuid = this.props.service && this.props.service.uuid
    const suuid = this.state.service && this.state.service.uuid

    if (nuuid != puuid && nuuid != suuid){
      this.setState({service: newprops.service}, this.reloadScreen.bind(this))
    }
  }
  render(){
    const {props, state} = this
    const plugin = props.plugin || props.params.plugin
    const component = props.component || props.params.component

    if (props.require_service && !state.service){
      return (
        <Tip
          title={i18n("No compatible service exists")}
          description={i18n("This screen requires a compatible service, and none was found.\n\nPlease add a compatible service type and try again.")}
          top_img={empty_box_img}
          middle_img={null}
        />
      )
    }
    let content

    const Screen = state.component
    if (Screen)
      content = (
        <Screen {...props} {...state}/>
      )
    else
      content = (
        <div ref="el" className="ui central white background expand">
          <Loading>
            External plugin {plugin}/{component}
          </Loading>
        </div>
      )
    return (
      <React.Fragment>
        {props.show_menu && (
          <ErrorBoundary>
            <SectionMenu
              menu={SelectService}
              onService={this.handleService.bind(this)}
              services={props.services}
              selected={state.service}
              />
          </ErrorBoundary>
        )}
        <ErrorBoundary>
          {content}
        </ErrorBoundary>
      </React.Fragment>
    )
  }
}

ExternalScreen.contextTypes = {
  router: PropTypes.object
}

export default ExternalScreen
