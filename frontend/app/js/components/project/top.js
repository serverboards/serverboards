import React from 'react'
import { goto, set_modal } from 'app/utils/store'
import {i18n, i18n_nop} from 'app/utils/i18n'
import {Restricted} from 'app/components'

class ServiceMenu extends React.Component{
  componentDidMount(){
    $(this.refs.service_selector).popup({
      popup: this.refs.service_selector_menu,
      on: 'click'
    })
  }
  handleChangeSection(section, service){
      $(this.refs.service_selector).popup('hide')
      this.props.onChangeSection(section, service)
  }
  render(){
    const props = this.props
    const service = props.service
    const candidates = props.candidates
    const section = props.section
    return (
      <div>
        <a className="item selector" key="service_selector" style={ service ? {textTransform:"none"} : {display: "none", textTransform:"none"}} ref="service_selector" id="service_selector">
          {service.name}
          <i className="ui icon chevron down"/>
        </a>
        <div className="ui popup with scroll" id="service_selector_menu" key="service_selector_menu" ref="service_selector_menu">
          {(candidates || []).map( c => (
            <a key={c.shortname} className={`item ${ c.uuid == service.uuid ? "bold teal" : ""}`} onClick={() => this.handleChangeSection(section, c.uuid)}>
              {c.name}
            </a>
          ))}
        </div>
      </div>
    )
  }
}

class SectionMenu extends React.Component{
  componentDidMount(){
    $(this.refs.section_selector).popup({
      popup: this.refs.section_selector_menu,
      on: 'click'
    })
  }
  handleChangeSection(section, service){
    $(this.refs.section_selector).popup('hide')
    this.props.onChangeSection(section, service)
  }
  render(){
    const {sections, section_id} = this.props
    return (
      <div>
        <a className="item selector" style={{textTransform:"none"}} ref="section_selector">
          {i18n( (sections.find( s => s.id == section_id ) || {}).name || section_id )}
          <i className="ui icon chevron down"/>
        </a>

        <div className="ui popup" id="section_selector_menu" key="section_selector_menu" ref="section_selector_menu">
          {(sections || []).map( p => (
            (p.candidates!=undefined && p.candidates.length>0) ? (
              <div key={p.id} className={`ui simple left pointing dropdown item ${ p.id == section_id ? "bold teal" : ""}`}>
                <div className="menu" style={{marginTop: -40, marginLeft: -5}}>
                  {p.candidates.map( s => (
                    <a key={s.uuid} className="item" onClick={() => this.handleChangeSection(p.id, s.uuid)}>{s.name}</a>
                  ))}
                </div>
                {p.name}
                <i className="caret right icon" style={{right: 0, position: "absolute"}}></i>
              </div>

            ) : (
              <a key={p.id} className={`item ${ p.id == section_id ? "bold teal" : ""}`} onClick={() => this.handleChangeSection(p.id)}>
                {p.name}
              </a>
            )
          ))}
        </div>
      </div>
    )
  }
}

class ProjectMenu extends React.Component{
  componentDidMount(){
    $(this.refs.project_selector).popup({
      popup: this.refs.project_selector_menu,
      on: 'click',
      lastResort: 'bottom left'
    })
  }
  handleChangeProject(shortname){
    $(this.refs.project_selector).popup('hide')
    goto(`/project/${shortname}/`)
  }
  render(){
    const { project_shortname, project_name, projects } = this.props
    return (
      <div>
        <a className="item selector" style={{textTransform:"none"}} ref="project_selector" id="project_selector">
          {project_name} <i className="ui icon chevron down"/>
        </a>
        <div className="ui popup with scroll"
            id="project_selector_menu"
            key="project_selector_menu"
            ref="project_selector_menu"
            >
          <Restricted perm="project.create">
            <a className="item"
                onClick={() => goto(`/project/wizard`, {step: 1})}
                style={{borderBottom: "1px solid #eee", width: 200}}
                id="add_project"
              >{i18n("Add project")}</a>
          </Restricted>
          {(projects || []).map( p => (
            <a key={p.shortname} className={`item ${p.shortname == project_shortname ? "bold teal" : null}`} onClick={() => this.handleChangeProject(p.shortname)}>
              {p.name}
            </a>
          ))}
        </div>
      </div>
    )
  }
}

class Top extends React.Component{
  constructor(props){
    super(props)
  }
  componentWillReceiveProps(nprops){
    const params = this.props.params
    const nparams = nprops.params
    // console.log("Component will receive props! %o %o", params, nparams)
    if (params.section != nparams.section){
      this.setState({section_menu: null})
    }
  }
  componentWillUnmount(){
    this.props.setHandlers(null, null)
  }
  handleChangeSection(shortname, uuid){
    if (uuid){
      goto(`/project/${this.props.project_shortname}/${shortname}/${uuid}`)
    }
    else{
      goto(`/project/${this.props.project_shortname}/${shortname}/`)
    }
  }
  render(){
    const {
      show_sidebar, onShowSidebar, project_name, section, subsection, section_name,
      projects, sections, service, project_shortname,
      } = this.props
    const {
      section_menu, section_menu_props
      } = this.state
    const section_id = (section.indexOf('.')>=0) ? `${section}/${subsection}` : section
    const section_data = sections.find( s => s.id == section_id )
    const service_data = section_data && section_data.candidates && section_data.candidates.find( s => s.uuid == service )
    const candidates = section_data && section_data.candidates
    const ExtraMenu = section_menu

    return (
      <div className="ui serverboards top menu secondary">
        {!show_sidebar ? (
          <a className="item" id="side_menu_toggle" onClick={() => onShowSidebar( !show_sidebar )}>
          <i className={`ui big icon content`}/>
          </a>
        ) : (
          <div style={{width: 20}}/>
        ) }

        <ProjectMenu projects={projects} project_name={project_name} project_shortname={project_shortname}/>
        <div>/</div>
        <SectionMenu
          sections={sections}
          section_id={section_id}
          onChangeSection={this.handleChangeSection.bind(this)}
          />
        { service_data ? ([
          <div>/</div>
          ,
          <ServiceMenu
            section={section_id}
            service={service_data}
            candidates={candidates}
            onChangeSection={this.handleChangeSection}
            />
          ]
        ) : null}

        {ExtraMenu && (
          <ExtraMenu {...section_menu_props}/>
        )}
      </div>
    )
  }
}

export default Top
