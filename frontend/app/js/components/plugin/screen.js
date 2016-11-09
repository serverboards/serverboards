import React from 'react'
import plugin from 'app/utils/plugin'
import Loading from '../loading'

const plugin_load = plugin.load
const plugin_do_screen = plugin.do_screen

const ExternalScreen = React.createClass({
  contextTypes: {
    router: React.PropTypes.object
  },
  getInitialState(){
    return {cleanupf(){}}
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
    const servername=localStorage.servername || window.location.origin

    const props=this.props
    let self=this
    //const service=this.props.location.state.service
    //console.log(service)
    console.log(props)
    const plugin = props.plugin || props.params.plugin
    const component = props.component || props.params.component
    const context = {
      plugin_id: plugin,
      component_id: component,
      screen_id: `${plugin}/${component}`
    }

    const load_js = () => {
      const plugin_js=`${plugin}/${component}.js`
      plugin_load(plugin_js).then(() =>
        plugin_do_screen(
          `${plugin}/${component}`,
          this.refs.el,
          props.data || this.props.location.state,
          context
        )
      ).then( (cleanupf) =>
        this.setState({cleanupf})
      ).catch( (e) => {
        console.warn("Could not load JS %o: %o", plugin_js, e)
      })
    }
    $(this.refs.el)
      .attr('data-pluginid', plugin)
      .attr('data-screenid', `${plugin}/${component}`)

    const plugin_html = `${plugin}/${component}.html`
    plugin_load(plugin_html,  {base_url: plugin})
    .then( (html) => {
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
      <div ref="el" className="ui central white background">
        <Loading>
          External plugin {plugin}/{component}
        </Loading>
      </div>
    )
  }
})

export default ExternalScreen
