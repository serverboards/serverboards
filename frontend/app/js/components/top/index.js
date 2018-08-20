import React from 'react'
import {Link} from 'app/router'
import {goto} from 'app/utils/store'
import Restricted from 'app/restricted'
import i18n from 'app/utils/i18n'
import { get_last_project } from 'app/utils/project'

require("sass/top.sass")
const icon_plugin = require("../../../imgs/007-icon-plugins.svg")

function notifications_color(notifications){
  if (!notifications || notifications.length==0)
    return ""
  return "blue"
}

class Top extends React.Component{
  constructor(props){ super(props)
    this.state = {
      open_time: undefined,
      show_popup: undefined,
    }
  }
  componentDidMount(){
    this.updateSemanticUIBehaviours()
  }
  componentDidUpdate(){
    this.updateSemanticUIBehaviours()
  }
  updateSemanticUIBehaviours(){
    let self = this
    $(this.refs.notifications_item).popup({
      popup: this.refs.notifications_menu,
      on: 'hover',
      hoverable: true,
      position: 'bottom center',
      lastResort: true,
      delay: {
        show: 100,
        hide: 300
      },
      onVisible(){
        self.setState({
          open_time: new Date(),
          show_popup: 'notifications'
        })
      },
      onHide(){
        if (self.state.show_popup == 'notifications')
          self.setState({show_popup: undefined})
      }
    })
    $(this.refs.actions).popup({
      popup: this.refs.processes_menu,
      on: 'hover',
      hoverable: true,
      position: 'bottom center',
      lastResort: true,
      onVisible(){
        self.setState({show_popup: 'actions'})
      },
      onHide(){
        if (self.state.show_popup == 'actions')
          self.setState({show_popup: undefined})
      }
    })
    $(this.refs.profile).popup({
      popup: this.refs.profile_menu,
      on: 'hover',
      hoverable: true,
      position: 'bottom right',
      lastResort: 'bottom right'
    })
    $(this.refs.el).find("[data-content]").popup()
    $(this.refs.settings).popup({
      popup: this.refs.settings_menu,
      on: 'hover',
      hoverable: true,
      position: 'bottom right',
      lastResort: 'bottom right'
    })
  }
  handleGotoProjects(){
    get_last_project()
      .then( project => project ? goto(`/project/${project}/`) : goto(`/`) )
  }
  render(){
    const props=this.props
    const section=props.section
    let logo=require("../../../imgs/favicon.png")
    return (
      <nav key={props.lang} className="ui serverboards top menu" id="top-menu" ref="el">
        {!props.sidebar && (
          <React.Fragment>
            <div className="item logo">
              <a href="#/">
                <img src={logo}/>
              </a>
            </div>
            <a className="item" onClick={props.onToggleSidebar}>
              <i className="ui bars big icon" style={{fontSize: 28}}/>
            </a>
            <span className="item separator"/>
          </React.Fragment>
        )}
      </nav>
    )
  }
}

export default Top
