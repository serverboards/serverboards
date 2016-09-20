import React from 'react'
import Loading from '../loading'
import Sidebar from 'app/containers/sidebar'
import PluginScreen from 'app/components/plugin/screen'
import {merge, object_is_equal} from 'app/utils'
import rpc from 'app/rpc'

function by_name(a,b){
  return a.name.localeCompare( b.name )
}

const SidebarSections = React.createClass({
  getInitialState(){
    return {service_menu: undefined}
  },
  get_screen_data(screen_id){
    return this.props.serverboard.screens.find( (s) => s.id == screen_id )
  },
  screen_choose_service(screen, candidates){
    if (this.state.service_menu && this.state.service_menu.screen.id == screen.id)
      this.setState({service_menu: undefined}) // toggle off
    else
      this.setState({service_menu: {screen, candidates}})
  },
  handleSectionChange(section, data){
    const serverboard = this.props.serverboard.shortname
    if (section.indexOf('/')>=0){
      const screen=this.get_screen_data(section)
      console.log(!screen.traits, screen.traits.length==0, data)
      if (!screen.traits || screen.traits.length==0 || (data && data.service)){
        if (data.service){
          rpc.call("service.info", [data.service.uuid]).then( (service) => { // May need full info
            this.props.goto({pathname: `/serverboard/${serverboard}/${section}/`, state: merge(data, {service}) })
          })
        }
        else{
            console.log("Section without associated service")
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

    const service_menu=this.state.service_menu
    const serverboard=this.props.serverboard

    return (
      <div className="ui vertical menu sections">
        <h3 className="ui item header">{props.serverboard.name}</h3>
        <MenuItem section="overview">Overview</MenuItem>
        <MenuItem section="services">Services</MenuItem>
        <MenuItem section="rules">Rules</MenuItem>
        <MenuItem section="settings">Settings</MenuItem>
        <div className="ui divider"/>
        {props.serverboard.screens.sort(by_name).map( (s) => (service_menu && service_menu.screen.id == s.id) ? (
          <div>
            <MenuItem section={s.id} data-tooltip={s.description} icon="caret down">{s.name}</MenuItem>
            <div className="menu">
              {service_menu.candidates.map( (service) => (
                <MenuItem
                  section={s.id}
                  data={{service, serverboard}}
                  data-tooltip={service.description}>
                    {service.name}
                </MenuItem>
              ))}
            </div>
          </div>
        ) : (
          <MenuItem
            section={s.id}
            data={{serverboard}}
            data-tooltip={s.description}
            icon={s.traits.length>0 ? "caret right" : undefined}>
              {s.name}
          </MenuItem>
        ))}
      </div>
    )
    //<MenuItem section="permissions">Permissions</MenuItem>
    //<MenuItem section="logs">Logs</MenuItem>
  }
})

const Serverboard=React.createClass({
  shouldComponentUpdate(nprops){
    const params = this.props.params
    const nparams = nprops.params
    const should_update = (
      (this.props.serverboard == undefined && nprops.serverboard != undefined) ||
      (params.section != nparams.section) ||
      (params.subsection != nparams.subsection) ||
      ( this.props.location != undefined &&
        nprops.location != undefined &&
        !object_is_equal(this.props.location.state, nprops.location.state)
      )
    )
    return should_update
  },
  selectSection(){
    const props=this.props
    const section = props.params.section || 'default'
    const subsection = props.params.subsection
    let Section
    if (section.indexOf('.')>=0){
      Section = (props) => (
        <PluginScreen {...props} plugin={section} component={subsection}/>
      )
      console.log("Got plugin screen %o", Section)
    }
    else
      Section = require(`../../containers/serverboard/${section}`).default
    return Section
  },
  render(){
    const props=this.props
    if (!props.serverboard)
      return (
        <Loading>
        Serverboard information.
        </Loading>
      )

    const Section = this.selectSection()

    return (
      <div className="ui central with menu">
        <Sidebar/>
        <SidebarSections
          section={props.params.section}
          serverboard={props.serverboard}
          goto={props.goto}
          />
        <div className="ui central white background">
          <Section serverboard={props.serverboard} subsection={props.params.subsection} location={props.location}/>
        </div>
      </div>
    )
  }
})

export default Serverboard
