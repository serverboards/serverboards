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
    if (this.state.cleanupf)
      this.state.cleanupf()
    else
      console.debug("Plugin did not specify a cleanup function. This may lead to resource leaks.")
  },
  componentDidMount(){
    const servername=localStorage.servername || window.location.origin

    const props=this.props
    let self=this
    //const service=this.props.location.state.service
    //console.log(service)
    const plugin = props.plugin || props.params.plugin
    const component = props.component || props.params.component

    const load_js = () => {
      plugin_load(`${plugin}/${component}.js`).then(() =>
        plugin_do_screen(
          `${plugin}/${component}`,
          this.refs.el,
          props.data || this.props.location.state
        )
      ).then( (cleanupf) =>
        this.setState({cleanupf})
      ).catch((e) => {
        console.error("Error loading plugin data: %o", e)
      })
    }

    $.get(`${servername}/static/${props.plugin}/${props.component}.html`, (html) => {
      $(this.refs.el).html(html)
      load_js()
    }).fail( (ev, text) => {
      console.log("Could not load HTML, loading JS anyway.")
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
