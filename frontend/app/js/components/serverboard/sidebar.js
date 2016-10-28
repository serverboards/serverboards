import React from 'react'
import {merge} from 'app/utils'
import rpc from 'app/rpc'
import ScreensMenu from 'app/components/service/screensmenu'

const SidebarSections = React.createClass({
  get_screen_data(screen_id){
    return this.props.serverboard.screens.find( (s) => s.id == screen_id )
  },
  get_service_data(uuid){
    // Gets service data, maybe including sub services (via/proxy)
    return rpc.call("service.info", [uuid]).then((service) => {
      let req=service.fields.filter( (f) => f.type == 'service' && service.config[f.name] )
      if (req.length > 0){
        return Promise.all(
            req.map( (f) => rpc.call("service.info", [service.config[f.name]]) )
          ).then( (subservices) => {
            subservices.map( (s, i) => {
              service.config[ req[i].name ]=s
            })
          return service
        } )
      }
      else{
        return service
      }
    })
  },
  handleSectionChange(section, data){
    const serverboard = this.props.serverboard.shortname
    if (section.indexOf('/')>=0){
      const screen=this.get_screen_data(section)
      if (!screen.traits || screen.traits.length==0 || (data && data.service)){
        if (data.service){
          this.get_service_data(data.service.uuid).then( (service) => { // May need full info
            this.props.goto({pathname: `/serverboard/${serverboard}/${section}/`, state: merge(data, {service}) })
          })
        }
        else{
          //console.log("Section without associated service")
          this.props.goto({pathname: `/serverboard/${serverboard}/${section}/`, state: data})
        }
      }
      else{
        const candidates = this.props.serverboard.services.filter( (s) => {
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
      this.props.goto(`/serverboard/${serverboard}/${section}`)
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

    const serverboard=this.props.serverboard

    return (
      <div className="ui vertical menu sections">
        <div>
          <h3 className="ui item header">{props.serverboard.name}</h3>
          <MenuItem section="dashboard">Dashboard</MenuItem>
          <MenuItem section="services">Services</MenuItem>
          <MenuItem section="rules">Rules</MenuItem>
          <MenuItem section="settings">Settings</MenuItem>
        </div>
        <ScreensMenu
          services={props.serverboard.services}
          screens={props.serverboard.screens}
          serverboard={props.serverboard}
          current={props.section}
          onSectionChange={this.handleSectionChange}
          />
      </div>
    )
    //<MenuItem section="permissions">Permissions</MenuItem>
    //<MenuItem section="logs">Logs</MenuItem>
  }
})

export default SidebarSections
