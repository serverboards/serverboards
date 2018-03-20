import React from 'react'
import Loading from '../loading'
import {object_is_equal, merge} from 'app/utils'
import PluginScreen from 'app/components/plugin/screen'
import SidebarSections from 'app/containers/project/sidebar'
import i18n from 'app/utils/i18n'
import Top from 'app/containers/project/top'
import {ErrorBoundary} from 'app/components'

require("sass/split-area.sass")

class Project extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      show_sidebar: localStorage.show_sidebar == "true",
    }
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
  handleShowSidebar(show_sidebar){
    localStorage.show_sidebar=show_sidebar ?  "true" : "false"
    this.setState({show_sidebar})
  }
  handleSetTopMenuHandlers(handleSetSectionMenu, handleSetSectionMenuProps){
    // The handlers are managed by top, so that when the menu changes there is
    // no need to redraw all the section, which can provoke a reload of the plugin
    // and leak the previous plugin screen
    this.setState({handleSetSectionMenu, handleSetSectionMenuProps})
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
        {this.state.show_sidebar ? (
          <SidebarSections
            key={props.project.name}
            section={props.params.section}
            subsection={props.params.subsection}
            project={props.project}
            projects_count={props.projects_count}
            goto={props.goto}
            onHideSidebar={() => this.handleShowSidebar(false)}
            />
        ) : null }
        <div className="ui vertical expand split area">
          <Top
            onShowSidebar={this.handleShowSidebar.bind(this)}
            show_sidebar={this.state.show_sidebar}
            params={props.params}
            setHandlers={this.handleSetTopMenuHandlers.bind(this)}
            />
          <div className="ui expand vertical split area with scroll" id="centralarea">
            {this.state.handleSetSectionMenu && ( // Hack to prevent redraw of section when top set the handlers.
              <ErrorBoundary>
                <Section
                  project={props.project}
                  subsection={props.params.subsection}
                  location={props.location}
                  setSectionMenu={this.state.handleSetSectionMenu}
                  setSectionMenuProps={this.state.handleSetSectionMenuProps}
                  />
              </ErrorBoundary>
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default Project
