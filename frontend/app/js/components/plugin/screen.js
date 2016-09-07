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
    //const service=this.props.location.state.service
    //console.log(service)
    $.get(`${servername}/static/${props.params.plugin}/${props.params.component}.html`, (html) => {
      $(this.refs.loading).html(html)

      plugin.load(`${props.params.plugin}/${props.params.component}.js`).done(() => {
        let cleanupf=plugin.do_screen(
          `${props.params.plugin}/${props.params.component}`,
          $('.ui.central'),
          this.props.location.state
        )
        this.setState({cleanupf})
      }).fail((e) => {
        console.error("Error loading plugin data: %o", e)
      })
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
