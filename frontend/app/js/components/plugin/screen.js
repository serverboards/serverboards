import React from 'react'
import plugin from 'app/utils/plugin'
import Loading from '../loading'

const ExternalScreen = React.createClass({
  contextTypes: {
    router: React.PropTypes.object
  },
  componentDidMount(){
    const servername=localStorage.servername || window.location.origin

    let props=this.props
    console.log(plugin)
    $.get(`${servername}/static/${props.params.plugin}/index.html`, (html) => {
      $(this.refs.loading).html(html)

      plugin.load(`${servername}/static/${props.params.plugin}/index.js`).done(() => {
        plugin.do_screen(
          `${props.params.plugin}/${props.params.component}`,
          $('.ui.central'),
          this.props.location.state
        )
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
