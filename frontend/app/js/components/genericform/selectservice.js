import React from 'react'
import rpc from 'app/rpc'
import RichDescription from './richdescription'
import i18n from 'app/utils/i18n'
import store from 'app/utils/store'
import {match_traits, map_get} from 'app/utils'
import cache from 'app/utils/cache'
import AddServiceModal from 'app/components/service/addmodal'
import PropTypes from 'prop-types'

function match_filter(s, filter){
  if (filter.project)
    if (!s.projects.includes(filter.project))
      return false
  return match_traits({has: s.traits, all: filter.traits || []})
}

class SelectService extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      items: [],
      show_add_modal: false
    }
  }
  prepareFilter(){
    let filter = {}
    let store_state = store.getState()
    if (this.props.traits)
      filter.traits=this.props.traits.split(' ')
    if (store_state.project.current)
      filter.project=store_state.project.current
    return filter
  }
  componentDidMount(){
    $(this.refs.select)
      .dropdown({
        onChange: (value) => {
          this.props.setValue(value)
        }
      })
      .dropdown('set value', this.props.value)
    this.updateServices()
  }
  updateServices(){
    const filter = this.prepareFilter()

    Promise.all([
      cache.services(),
      cache.service_catalog()
    ]).then( ([services, templates]) => {
      // console.log(services, templates)
      const items=services
        .filter(s => match_filter({...s, traits: map_get(templates, [s.type, "traits"], [])}, filter))
        .map( (s) => ({
          //name: s.name,
          value: s.uuid,
          name: s.name,
          description: (s.fields || []).filter( (p) => p.card ).map( (p) => p.value ).join(',')
        }))
      // console.log("Items", services, items, filter)
      this.setState({items})
    })
  }
  handleAddService(){
    const filter = this.prepareFilter()
    this.setState({show_add_modal: true})
  }
  render(){
    const props = this.props

    const defaultName = (this.state.items.find( s => s.value == props.value ) || {}).name

    return (
      <div className="field">
        <label>{i18n(props.label)}</label>
        {props.description && (
          <RichDescription className="ui meta" value={props.description} vars={props.vars}/>
        )}
        <div ref="select" className={`ui fluid ${props.search ? "search" : ""} selection dropdown`}>
          <input type="hidden" name={defaultName} defaultValue={props.value} onChange={props.onChange}/>
          <i className="dropdown icon"></i>
          <div className="default text" style={{display:"block"}}>{(props.value || {}).uuid || defaultName || props.placeholder}</div>
          <div className="menu">
            <div key={"empty"} className="item" data-value="">{i18n("No service")}</div>
            {(this.state.items || []).map( (ac) => (
              <div key={ac.value} className="item" data-value={ac.value}>{ac.name}<span className="ui meta" style={{float:"right"}}>{ac.description}</span></div>
            ))}
          </div>
        </div>
        <div className="right aligned" style={{marginTop: 0, marginRight: 0}}>
          <a
            className="ui teal basic button"
            style={{marginTop: 10}}
            onClick={() => this.handleAddService()}
            >
            {i18n("Add new service")}</a>
            {this.state.show_add_modal && (
              <AddServiceModal
                filter={this.prepareFilter()}
                hide_old={true}
                store={store}
                onServiceAdded={(s) => {
                  this.setState({show_add_modal: false})
                  this.updateServices()
                  $(this.refs.select).dropdown('refresh').dropdown('set value', s)
                }}
                onClose={() => this.setState({show_add_modal: false})}
                />
            )}
        </div>
      </div>
    )
  }
}

SelectService.propTypes={
  traits:  PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]).isRequired,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  dynamic: PropTypes.bool,
  default: PropTypes.string,
}

export default SelectService
