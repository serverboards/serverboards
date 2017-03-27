import React from 'react'
import {merge} from 'app/utils'
import rpc from 'app/rpc'
import ScreensMenu from 'app/components/service/screensmenu'
import {get_service_data} from 'app/components/service/utils'
import ServerboardSelector from 'app/containers/project/projectselector'
import i18n from 'app/utils/i18n'

function ProjectHeader(props){
  return (
    <div className="ui item header">
      <div className="ui grid">
        <div className="eleven wide column">
          <h3 className="ui header" style={{margin: 0}}>{i18n("Projects")} <span style={{fontSize:"0.8em", color: "#acb5b5"}}>({props.projects_count})</span></h3>
        </div>
        <div className="five wide column right aligned">
          <a onClick={props.toggleShowServerboardSelector} className="item"><i className="icons">
            <i className="icon content yellow"/>
            <i className="icon inverted corner search yellow"/>
          </i></a>
        </div>
      </div>
      <span className="corner decorator"/>
      <h4 className="ui header teal dividing" style={{margin: "10px 0 0 15px"}}>{props.project.name}</h4>
    </div>
  )
}

const SidebarSections = React.createClass({
  getInitialState(){
    return {
      show_project_selector: false
    }
  },
  toggleShowServerboardSelector(){
    this.setState({show_project_selector: !this.state.show_project_selector})
  },
  get_screen_data(screen_id){
    return this.props.project.screens.find( (s) => s.id == screen_id )
  },
  handleSectionChange(section, data){
    const project = this.props.project.shortname
    if (section.indexOf('/')>=0){
      const screen=this.get_screen_data(section)
      if (!screen.traits || screen.traits.length==0 || (data && data.service)){
        if (data.service){
          get_service_data(data.service.uuid).then( (service) => { // May need full info
            this.props.goto({pathname: `/project/${project}/${section}/`, state: merge(data, {service}) })
          })
        }
        else{
          //console.log("Section without associated service")
          this.props.goto({pathname: `/project/${project}/${section}/`, state: data})
        }
      }
      else{
        const candidates = this.props.project.services.filter( (s) => {
          for (let trait of screen.traits){
            if (s.traits.includes(trait))
              return true
            }
          return false
        })
        console.log("Candidate services are %o", candidates.map( (s) => s.name ))
        this.screen_choose_service(screen, candidates)
      }
    }
    else{
      this.props.goto(`/project/${project}/${section}`)
    }
  },
  render(){
    const props=this.props
    let self=this
    function MenuItem(menu_props){
      let klass="item"
      let current=[]
      if (menu_props.section==props.section){
        klass+=" active"
        current=(
          <i className="icon angle right floating right"/>
        )
      }
      if (menu_props.icon){
        current=(
          <i className={`icon ${menu_props.icon}`}/>
        )
      }
      return (
        <a className={klass} onClick={() => self.handleSectionChange(menu_props.section, menu_props.data)}>
        {menu_props.children}
        {current}
        </a>
      )
    }

    const project=props.project

    return (
      <div>
        <div className="ui vertical menu sections">
          <div>
            <ProjectHeader {...props} toggleShowServerboardSelector={this.toggleShowServerboardSelector}/>
            <MenuItem section="dashboard">{i18n("Dashboard")}</MenuItem>
            <MenuItem section="services">{i18n("Services")}</MenuItem>
            <MenuItem section="rules">{i18n("Rules")}</MenuItem>
            <MenuItem section="issues">{i18n("Issues")}</MenuItem>
          </div>
          <ScreensMenu
            services={props.project.services}
            screens={props.project.screens}
            project={props.project}
            section={`${props.section}/${props.subsection}`}
            onSectionChange={this.handleSectionChange}
            />
          <div>
            <MenuItem section="settings">{i18n("Settings")}</MenuItem>
          </div>

        </div>
        {this.state.show_project_selector ? (
          <ServerboardSelector onClose={this.toggleShowServerboardSelector} className="center"/>
        ) : null }
      </div>
    )
    //<MenuItem section="permissions">Permissions</MenuItem>
    //<MenuItem section="logs">Logs</MenuItem>
  }
})

export default SidebarSections
