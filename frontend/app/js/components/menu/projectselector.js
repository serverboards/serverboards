import React from 'react'
import LogoIcon from '../logoicon'
import i18n from 'app/utils/i18n'
import Restricted from 'app/restricted'
import {goto} from 'app/utils/store'

function filter_project(s, search){
  let valid = true
  for (let q of search){
    if (! (
        s.name.toLowerCase().includes(q) ||
        s.shortname.toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
      ) )
        valid=false
  }
  return valid
}

function sorted_by_name(projects){
  return projects.concat().sort( function(a,b){ return a.name.localeCompare(b.name) })
}

class Selector extends React.Component{
  constructor(props){
    super(props)
    console.log("Seelctor", props)

    let projects = this.props.projects
    this.state = {
      search: undefined,
      selected: -1,
      projects: sorted_by_name(projects)
    }
  }
  setSearch(search){
    let projects = this.props.projects
    if (search){
      search = search.toLowerCase().split(" ")
      projects = projects.filter( (s) => filter_project(s, search) )
    }
    projects = sorted_by_name(projects)
    this.setState({
      selected: 0,
      search,
      projects
    })
  }
  componentDidMount(){
    $(this.refs.search)
      .focus()
      .on('keyup', (ev) => {
        console.log(ev.keyCode)
        switch(ev.keyCode){
          case 27:
            console.log("Close!")
            ev.preventDefault()
            ev.stopPropagation()
            this.props.onClose && this.props.onClose()
            break;
          case 13:
            console.log(this.state)
            this.handleSelectServerboard(this.state.projects[this.state.selected].shortname)
            break;
          case 40:
            this.setState({selected: Math.min(this.state.selected+1, this.state.projects.length-1)})
            break;
          case 38:
            this.setState({selected: Math.max(this.state.selected-1, 0)})
            break;
        }
      })
  }
  componentWillReceiveProps(newprops){
    this.setState({projects: sorted_by_name(newprops.projects)})
  }
  componentDidUpdate(){
    $(this.refs.el).find('.menu').animate({
      scrollTop: Math.max(0, (this.state.selected * 59) - 200)
    },100)
  }
  handleSelectServerboard(project){
    this.props.onServiceSelect(project)
    this.props.onClose && this.props.onClose()
  }
  handleAddProject(ev){
    ev.preventDefault()
    goto(`/project/wizard`, {step: 1})
    this.props.onClose && this.props.onClose()
  }
  render(){
    const props=this.props
    const state=this.state
    const current=props.current
    const selected=state.selected
    const projects = state.projects
    return (
      <div className="ui sidebar" id="projects">
        <div ref="el" className={`ui vertical split area project selector ${props.className}`}>
          <div className="ui search with padding">
            <div className="ui icon input">
              <input ref="search" className="prompt" type="text" placeholder={i18n("Search by name")} onChange={(ev) => this.setSearch(ev.target.value)}/>
              <i className="search icon"/>
            </div>
          </div>
          <div className="ui vertical split area">
            {projects.map( (s, i) => (
              <a className={`item ${ s.shortname == current ? "selected" : ""} ${ i == selected ? "hover" : ""}`} onClick={() => this.handleSelectServerboard(s.shortname)}>
                <div>{s.name}</div>
              </a>
            ))}
          </div>
          <Restricted perm="project.create">
            <a onClick={this.handleAddProject.bind(this)} href="#/project/wizard" className="ui bottom full button yellow">
              {i18n("Add project")} <i className="add icon"></i>
            </a>
          </Restricted>
        </div>
      </div>
    )
  }
}

export default Selector
