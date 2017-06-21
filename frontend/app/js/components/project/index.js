import React from 'react'
import Loading from '../loading'
import {object_is_equal, merge} from 'app/utils'
import PluginScreen from 'app/components/plugin/screen'
import SidebarSections from './sidebar'
import i18n from 'app/utils/i18n'
import Top from 'app/containers/project/top'

require("sass/split-area.sass")

const Project=React.createClass({
  getInitialState(){
    return {
      show_sidebar: localStorage.show_sidebar == "true",
      section_menu: null,
      section_menu_props: {}
    }
  },
  componentWillReceiveProps(nprops){
    const params = this.props.params
    const nparams = nprops.params
    // console.log("Component will receive props! %o %o", params, nparams)
    if (params.section != nparams.section){
      this.setState({section_menu: null})
    }
  },
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

    if (this.section_menu)
      return true
    return should_update
  },
  selectSection(){
    const props=this.props
    const section = props.params.section || 'dashboard'
    const subsection = props.params.subsection
    const service_uuid = props.params.service
    const service = service_uuid && props.project.services.find( s => s.uuid == service_uuid )
    const data = merge( props.data, {service} )
    let Section
    if (section.indexOf('.')>=0){
      Section = (props) => (
        <PluginScreen {...props} data={data} plugin={section} component={subsection}/>
      )
      console.log("Got plugin screen %o", Section)
    }
    else
      Section = require(`../../containers/project/${section}`).default
    return Section
  },
  handleShowSidebar(show_sidebar){
    localStorage.show_sidebar=show_sidebar ?  "true" : "false"
    this.setState({show_sidebar})
  },
  handleSetSectionMenu(section_menu, section_menu_props={}){
    this.setState({section_menu, section_menu_props})
  },
  handleSetSectionMenuProps(section_menu_props){
    this.setState({section_menu_props})
  },
  render(){
    const props=this.props
    if (!props.project)
      return (
        <Loading>
        {i18n("Project information")}
        </Loading>
      )

    const Section = this.selectSection()
    const SectionMenu = this.state.section_menu || (() => null)

    return (
      <div className="ui horizontal split area">
        {this.state.show_sidebar ? (
          <SidebarSections
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
            onShowSidebar={this.handleShowSidebar}
            show_sidebar={this.state.show_sidebar}
            params={props.params}
            >
            <SectionMenu {...this.state.section_menu_props}/>
          </Top>
          <div className="ui expand vertical split area with scroll">
            <Section
              project={props.project}
              subsection={props.params.subsection}
              location={props.location}
              setSectionMenu={this.handleSetSectionMenu}
              setSectionMenuProps={this.handleSetSectionMenuProps}
              />
          </div>
        </div>
      </div>
    )
  }
})

export default Project
