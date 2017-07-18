import React from 'react'
import {merge} from 'app/utils'
import {set_modal} from 'app/utils/store'
import rpc from 'app/rpc'
import ScreensMenu from 'app/components/service/screensmenu'
import {get_service_data} from 'app/components/service/utils'
import ServerboardSelector from 'app/containers/project/projectselector'
import i18n from 'app/utils/i18n'

const serverboards_logo = require('app/../imgs/007-logo_serverboards_font.svg')

const SPECIAL_ITEM_STYLE = {
  borderTop:"1px solid #aaa",
  height: 60,
  lineHeight: "30px",
  margin: 0,
  textTransform: "uppercase"
}

function ProjectHeader(props){
  return (
    <div className="ui vertical split area">
      <div className="ui horizontal split area padding">
        <h3 className="ui header expand" style={{margin: 0, fontSize: 30}}>
          <img src={serverboards_logo} style={{width: "100%", marginTop: -2}}/>
        </h3>
        <a className="item" onClick={props.onHideSidebar} style={{cursor:"pointer", color: "white", padding: 10}}>
          <i className="ui icon content" style={{fontSize: 22}}/>
        </a>
      </div>
      <h2 className="ui header teal" style={{margin: "0 0 0 15px"}}>{props.project.name}</h2>
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
    const section = props.section || "dashboard"
    function MenuItem(menu_props){
      let klass="item"
      let current=[]
      if (menu_props.section==section){
        klass+=" active"
      }
      if (menu_props.icon){
        current=(
          <i className={`icon ${menu_props.icon}`}/>
        )
      }
      return (
        <a style={menu_props.style} className={klass} onClick={() => self.handleSectionChange(menu_props.section, menu_props.data)}>
        {menu_props.children}
        {current}
        </a>
      )
    }

    const project=props.project

    return (
      <div className="ui dark vertical menu sections">
        <div>
          <ProjectHeader {...props}/>
          <MenuItem section="dashboard">{i18n("Dashboard")}</MenuItem>
          <MenuItem section="services">{i18n("Services")}</MenuItem>
          <MenuItem section="rules">{i18n("Rules")}</MenuItem>
          <MenuItem section="issues" style={{display:"flex"}}><span>{i18n("Issues")}</span>
            {props.new_issues ? (
              <span className={`ui micro label circular blue`}/>
            ) : null }
          </MenuItem>
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

        <a className="item" onClick={this.toggleShowServerboardSelector} style={SPECIAL_ITEM_STYLE}>
          {i18n("View all projects")}
          <i className={`icon folder`}/>
        </a>
        <a className="item" onClick={() => set_modal("project.create")} style={merge(SPECIAL_ITEM_STYLE, {borderBottom: "1px solid #aaa"})}>
          {i18n("Create new project")}
          <i className={`icon yellow add`}/>
        </a>

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
