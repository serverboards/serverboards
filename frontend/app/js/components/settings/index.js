import React from 'react'
import Link from 'app/router'
import Overview from 'app/containers/settings/overview'
import Users from 'app/containers/settings/users'
import Groups from 'app/containers/settings/groups'
import Plugins from 'app/components/settings/plugins'
import System from 'app/containers/settings/system'
import {SectionMenu} from 'app/components'
import Logs from 'app/containers/logs'
import Restricted from 'app/restricted'
import {i18n, i18n_nop} from 'app/utils/i18n'
import {ErrorBoundary} from 'app/components/error'
import Marketplace from 'app/containers/settings/marketplace'

const sections={
  overview: [Overview, i18n_nop("Overview")],
  users: [Users, i18n_nop("Users")],
  groups: [Groups, i18n_nop("Groups")],
  marketplace: [Marketplace, i18n_nop("Marketplace")],
  plugins: [Plugins, i18n_nop("Plugins")],
  system: [System, i18n_nop("System")],
  logs: [Logs, i18n_nop("Logs")]
}


class Settings extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      section: "overview"
    }
  }
  handleSectionChange(section){
    this.setState({section})
  }
  render(){
    const props = this.props
    const section = this.state.section
    const Section = sections[section][0]
    // console.log("Section %o", section, Section)

    return (
      <div className="ui expand vertical expand split area with scroll">
        <SectionMenu key={section} menu={() => (
          <div className="ui attached tabular menu">
            {Object.entries(sections).map( ([key, value]) => (
              <a key={key} className={`item ${key == section ? "active" : ""}`} onClick={() => this.handleSectionChange(key)}>
                {i18n(value[1])}
              </a>
            ))}
          </div>
        )}/>

        <ErrorBoundary>
          <Section {...props} location={props.location}/>
        </ErrorBoundary>
      </div>
    )
  }
}


export default Settings
