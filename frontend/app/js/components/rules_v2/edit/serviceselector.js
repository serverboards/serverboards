import React from 'react'
import PropTypes from 'prop-types'
import i18n from 'app/utils/i18n'
import cache from 'app/utils/cache'
import store from 'app/utils/store'
import Loading from 'app/components/loading'
import Icon from '../../iconicon'
import Card from 'app/components/card'
import {MarkdownPreview} from 'react-marked-markdown'
import {service_add_future} from 'app/containers/service/add'
import {AddServiceDetailsForm} from 'app/components/service/add'

class ServiceSelector extends React.Component{
  constructor(props){
    super(props)
    this.state={
      filter: "",
      type: undefined,
      services: []
    }

    this.handleRealAddService = (project, service) => {
      return service_add_future(project, service)
        .then(uuid => {
          service = {...service, uuid, type: service.id}
          return this.props.onSelect(service)
        })
    }
  }
  componentDidMount(){
    const current_project = store.getState().project.current
    cache.service_type(this.props.type).then( type => this.setState({type}) )
    cache.services().then( services => {
      services = services.filter( s=> this.props.type == s.type && s.projects.includes(current_project) )
      this.setState({services})
    })
  }
  handleCreateNew(){
    this.setState({create_new:true})
  }
  render(){
    const state = this.state
    const props = this.props
    const {type} = state

    if (!type)
      return (
        <Loading>{i18n("Services")}</Loading>
      )
    if (state.create_new){
      return (
        <AddServiceDetailsForm
          service={state.type}
          onAddService={this.handleRealAddService}
          project={props.project}
          />
        )
    }

    const plugin_id = type.type.split('/')[0]

    return (
      <div className="extend">
        <div className="ui attached top form">
          <div className="ui input seamless white">
            <i className="icon search"/>
            <input type="text" onChange={(ev) => this.onFilter(ev.target.value)} placeholder={i18n("Filter...")}/>
          </div>
        </div>
        <h2 className="ui centered header">
          <Icon icon={type.icon || "server"} plugin={plugin_id}/>
          <span>{i18n("Select a {name} or create one", {name: type.name})}</span>
        </h2>
        <div className="ui padding">
          <MarkdownPreview value={i18n(type.description) || ""}/>
        </div>

        <div className="ui with scroll and padding">
          <div className="ui cards v2">
            {this.state.services.map(s => (
              <Card
                container="a"
                key={s.uuid}
                icon={type.icon}
                tags={s.tags}
                plugin={plugin_id}
                title={s.name || i18n(type.name)}
                description={s.description || i18n(type.description)}
                onClick={() => this.props.onSelect(s)}
                />
            )) }
          </div>
        </div>
        <div className="right aligned">
          <span className="ui buttons">
            <button className="ui button basic" onClick={this.props.prevStep}>{i18n("Previous step")}</button>
            <button className="ui button teal" onClick={() => this.handleCreateNew()}>
              {i18n("Create new {type} connection", {type: type.name})}
            </button>
          </span>
        </div>
      </div>
    )
  }
}

ServiceSelector.propTypes={
  onSelect: PropTypes.func.isRequired,
  prevStep: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  current: PropTypes.string
}


export default ServiceSelector
