import React from 'react'
import plugin from 'app/utils/plugin'
import Loading from '../loading'
import {merge} from 'app/utils'

const plugin_load = plugin.load
const plugin_do_screen = plugin.do_screen

const ExternalScreen = React.createClass({
  contextTypes: {
    router: React.PropTypes.object
  },
  getInitialState(){
    return {
      cleanupf(){},
    }
  },
  componentWillUnmount(){
    if (this.state.cleanupf){
      console.debug("Cleanup plugin screen")
      this.state.cleanupf()
      $(this.refs.el).html('')
    }
    else
      console.debug("Plugin did not specify a cleanup function. This may lead to resource leaks.")
  },
  componentDidMount(){
    const props=this.props
    let self=this
    //const service=this.props.location.state.service
    //console.log(service)
    // console.log(props)
    const plugin = props.plugin || props.params.plugin
    const component = props.component || props.params.component
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
          {...(props.data || this.props.location.state), ...props, project: props.project},
          context
        )
      }).then( (cleanupf) => {
        this.setState({cleanupf})
      }).catch( (e) => {
        console.warn("Could not load JS %o: %o", plugin_js, e)
      })
    }
    $(this.refs.el)
      .attr('data-pluginid', plugin)
      .attr('data-screenid', `${plugin}/${component}`)

    const hints = this.props.hints || []
    const plugin_html = `${plugin}/${component}.html`
    const plugin_css = `${plugin}/${component}.css`
    Promise.all([
      !hints.includes("nohtml") && plugin_load(plugin_html,  {base_url: plugin}),
      !hints.includes("nocss") && plugin_load(plugin_css,  {base_url: plugin})
    ]).then( (html) => {
      $(this.refs.el).html(html)
      load_js()
    }).catch( (e) => {
      console.warn("Could not load HTML %o: %o", plugin_html, e)
      $(this.refs.el).html('')
      load_js()
    })
  },
  render(){
    let props=this.props
    const plugin = props.plugin || props.params.plugin
    const component = props.component || props.params.component

    return (
      <div ref="el" className="ui central white background expand">
        <Loading>
          External plugin {plugin}/{component}
        </Loading>
      </div>
    )
  }
})

export default ExternalScreen
