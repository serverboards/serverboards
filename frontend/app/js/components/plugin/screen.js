import React from 'react'
import plugin from '../../utils/plugin'
import Loading from '../loading'

const ExternalScreen = React.createClass({
  contextTypes: {
    router: React.PropTypes.object
  },
  componentDidMount(){
    console.log("Loaded! %o",
      this.props.location.state
      )

    let props=this.props
    console.log(plugin)
    $.get(`/static/${props.params.plugin}/${props.params.component}/index.html`, (html) => {
      $(this.refs.loading).html(html)

      plugin.load(`/static/${props.params.plugin}/${props.params.component}/index.js`).done(() => {
        plugin.do_screen(
          `${props.params.plugin}/${props.params.component}`,
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
