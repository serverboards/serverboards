import React from 'react'
import plugin from 'app/utils/plugin'
import Loading from '../loading'
import {merge, to_keywordmap, match_traits, map_get} from 'app/utils'
import PropTypes from 'prop-types';
import {SectionMenu} from 'app/components'
import store from 'app/utils/store'
import i18n from 'app/utils/i18n'

const plugin_load = plugin.load
const plugin_do_screen = plugin.do_screen

function SelectService(props){
  const services = props.services || []

  return (
    <div className="menu">
      <div style={{width: 30}}/>
      <div className="ui attached tabular menu">
        {services.length > 0 ? services.map( s => (
          <a key={s.uuid} className={`item ${s.uuid == props.selected ? "active" : ""}`} onClick={() => props.onService(s.uuid)}>
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

    const plugin = props.plugin || props.params.plugin
    const component = props.component || props.params.component
    const screen_id = `${plugin}/${component}`

    // to avoid one method.. feels dirty, but its the right thing to do
    const state = store.getState()
    const screen = state.menu.screens.find( s => s.id == screen_id )
    const services = state.project.project.services.filter( s => {
      return match_traits({ has: s.traits, any: screen.traits })
    })

    const service = map_get(this.props, ["data", "service"])
    let current = undefined
    if (service)
      current = service.uuid

    this.state = {
      umount: undefined,
      component: undefined,
      screen,
      services,
      current,
      service
    }
  }
  componentWillUnmount(){
    if (this.state.umount){
      console.debug("Cleanup plugin screen")
      this.state.umount()
      $(this.refs.el).html('')
    }
  }
  componentDidMount(){
    this.reloadScreen()
  }
  reloadScreen(){
    this.componentWillUnmount()
    const props=this.props
    let self=this
    //const service=this.props.location.state.service
    //console.log(service)
    // console.log(props)
    const plugin = props.plugin || props.params.plugin
    const component = props.component || props.params.component

    let service = this.state.service
    if (!service && this.state.services.length > 0 && !this.state.current){
      const current = this.state.services[0].uuid
      service = this.state.services.find( s => s.uuid == current )
      this.setState({current, service})
    }

    const context = {
      plugin_id: plugin,
      component_id: component,
      screen_id: `${plugin}/${component}`,
      setSectionMenu: props.setSectionMenu,
    }

    const load_js = () => {
      if (this.state.cleanupf){
        this.state.cleanupf() // Call before setting a new one
        this.setState({cleanupf(){}})
      }
      const plugin_js=`${plugin}/${component}.js`
      plugin_load(plugin_js).then(() => {
        const el = this.refs.el
        return plugin_do_screen(
          `${plugin}/${component}`,
          el,
          {...(props.data || this.props.location.state), ...props, project: props.project, service},
          context
        )
      }).then( ({umount, component}) => {
        this.setState({umount, component})
      }).catch( (e) => {
        console.warn("Could not load JS %o: %o", plugin_js, e)
      })
    }
    $(this.refs.el)
      .attr('data-pluginid', plugin)
      .attr('data-screenid', `${plugin}/${component}`)

    const hints = to_keywordmap(this.props.hints)
    const plugin_html = `${plugin}/${component}.html`
    const plugin_css = `${plugin}/${component}.css`
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
    console.log("Set service", current)
    const service = this.state.services.find( s => s.uuid == current )
    this.setState({current, service}, this.reloadScreen.bind(this))
  }
  render(){
    let props=this.props
    const plugin = props.plugin || props.params.plugin
    const component = props.component || props.params.component

    const Screen = this.state.component
    if (Screen)
      content = (
        <Screen {...props} service={service} {...this.state}/>
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
        {(this.state.screen.traits.length > 0) && !props.data.service ? (
          <SectionMenu
            menu={SelectService}
            onService={this.handleService.bind(this)}
            services={this.state.services}
            selected={this.state.current}
            />
        ) : null}
        {content}
      </React.Fragment>
    )
  }
}

ExternalScreen.contextTypes = {
  router: PropTypes.object
}

export default ExternalScreen
