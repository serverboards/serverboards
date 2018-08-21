import React from 'react'
import Link from 'app/router'
import Overview from 'app/containers/settings/overview'
import Users from 'app/containers/settings/users'
import Groups from 'app/containers/settings/groups'
import Plugins from 'app/containers/settings/plugins'
import System from 'app/containers/settings/system'
import Logs from 'app/containers/logs'
import Restricted from 'app/restricted'
import i18n from 'app/utils/i18n'
import {ErrorBoundary} from 'app/components/error'

const sections={
  overview: Overview,
  users: Users,
  groups: Groups,
  plugins: Plugins,
  system: System,
  logs: Logs
}


function Settings(props){
  let section = props.params.section || 'overview'
  let Section = sections[section]
  // console.log("Section %o", section)

  return (
    <div className="ui expand vertical expand split area with scroll">
      <ErrorBoundary>
        <Section {...props} location={props.location}/>
      </ErrorBoundary>
    </div>
  )
}


export default Settings
