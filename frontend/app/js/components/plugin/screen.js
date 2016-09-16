import React from 'react'
import plugin from 'app/utils/plugin'
import Loading from '../loading'

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
    function load_js(){
      plugin.load(`${props.params.plugin}/${props.params.component}.js`).then(() => {
        let cleanupf=plugin.do_screen(
          `${props.params.plugin}/${props.params.component}`,
          self.refs.loading,
          props.location.state
        )
        self.setState({cleanupf})
      }).catch((e) => {
        console.error("Error loading plugin data: %o", e)
      })
    }

    $.get(`${servername}/static/${props.params.plugin}/${props.params.component}.html`, (html) => {
      $(this.refs.loading).html(html)
      load_js()
    }).fail( (ev, text) => {
      console.log("Could not load HTML, loading JS")
      load_js()
    })
  },
  render(){
    let props=this.props
    return (
      <div ref="loading" className="ui central white background">
        <Loading>
          External plugin {props.params.plugin}/{props.params.component}
        </Loading>
      </div>
    )
  }
})

export default ExternalScreen
