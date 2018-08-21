import React from 'react'
import Loading from '../loading'
import {object_is_equal, merge} from 'app/utils'
import PluginScreen from 'app/components/plugin/screen'
import SidebarSections from 'app/containers/project/sidebar'
import i18n from 'app/utils/i18n'
import {ErrorBoundary} from 'app/components'

require("sass/split-area.sass")

class Project extends React.Component{
  constructor(props){
    super(props)
  }
  shouldComponentUpdate(nprops, nstate){
    if (!object_is_equal(this.state, nstate))
      return true

    const params = this.props.params
    const nparams = nprops.params

    const should_update = (
      (this.props.project == undefined && nprops.project != undefined) ||
      (params.section != nparams.section) ||
      (params.subsection != nparams.subsection) ||
      (params.service != nparams.service) ||
      ( this.props.location != undefined &&
        nprops.location != undefined &&
        !object_is_equal(this.props.location.state, nprops.location.state)
      )
    )

    return should_update
  }
  selectSection(){
    const props=this.props
    const section = props.params.section || 'dashboard'
    const subsection = props.params.subsection
    // const service_uuid = props.params.service
    // const service = service_uuid && props.project.services.find( s => s.uuid == service_uuid )
    const data = {...props.data, ...props.location.state }
    let Section
    if (section.indexOf('.')>=0){
      const plugin_component_id = `${section}/${subsection}`
      const screen = props.project.screens.find( s => s.id == plugin_component_id) || {}
      Section = (props) => (
        <PluginScreen {...props}
          data={data}
          plugin={section}
          component={subsection}
          hints={screen.hints}
          />
      )
      // console.log("Got plugin screen %o", Section)
    }
    else
      Section = require(`app/containers/project/${section}`).default
    return Section
  }
  render(){
    const props=this.props
    if (!props.project)
      return (
        <Loading>
        {i18n("Project information")}
        </Loading>
      )

    const Section = this.selectSection()

    return (
      <div className="ui horizontal split area">
        <div className="ui vertical expand split area">
          <div className="ui expand vertical split area with scroll" id="centralarea">
            <ErrorBoundary>
              <Section
                project={props.project}
                subsection={props.params.subsection}
                location={props.location}
                />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    )
  }
}

export default Project
