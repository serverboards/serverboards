import React from 'react'
import Loading from '../loading'
import {object_is_equal} from 'app/utils'
import PluginScreen from 'app/components/plugin/screen'
import Sidebar from 'app/containers/sidebar'
import SidebarSections from './sidebar'

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
      <div className="ui central with menu white background">
        <Sidebar/>
        <SidebarSections
          section={props.params.section}
          serverboard={props.serverboard}
          goto={props.goto}
          />
        <div className="ui central">
          <Section serverboard={props.serverboard} subsection={props.params.subsection} location={props.location}/>
        </div>
      </div>
    )
  }
})

export default Serverboard
