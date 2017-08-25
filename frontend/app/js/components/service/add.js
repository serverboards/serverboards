import React from 'react'
import i18n from 'app/utils/i18n'
import Selector from 'app/components/selector'
import Flash from 'app/flash'
import GenericForm from 'app/components/genericform'
import Loading from 'app/components/loading'
import cache from 'app/utils/cache'
import plugin from 'app/utils/plugin'
import {MarkdownPreview} from 'react-marked-markdown'
import ServiceSelect from 'app/components/service/select'
import {goto} from 'app/utils/store'

require('sass/panes.sass')

class AddServiceDetailsForm extends React.Component{
  constructor(props){
    super(props)
    this.state={
      data: {},
      name: "",
      descritpion: ""
    }

    this.handleAddService = () => {
      const props = this.props
      const state = this.state
      const service = {
        name: state.name,
        type: props.service.type,
        description: state.description,
        config: state.data
      }
      props
        .onAddService(props.project, service)
        .then( (uuid) => goto(`/project/${props.project}/services/${uuid}`))
    }
  }
  render(){
    const {service, gotoStep} = this.props
    return (
      <div className="ui with padding extend">
        <MarkdownPreview value={service.description}/>

        <form className="ui form">
          <label>{i18n("Service name")}</label>
          <input
            onChange={(ev) => this.setState({name: ev.target.value})}
            defaultValue={this.state.name}
            />
          <label>{i18n("Description")}</label>
          <textarea
            onChange={(ev) => this.setState({description: ev.target.value})}
            defaultValue={this.state.description}
            />
        </form>
        <div className="separator" style={{height: 40}}/>
        <GenericForm fields={service.fields} updateForm={(data) => this.setState({data})}/>
        <div className="separator" style={{height: 40}}/>

        <div className="ui right aligned">
          <div className="ui buttons">
            <button
              className="ui button basic"
              onClick={() => gotoStep(1)}>
                {i18n("Previous step")}
            </button>
            <button
              className="ui teal button"
              onClick={this.handleAddService}>
                {i18n("Save and Continue")}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

function AddServiceButton({service}){
  return (
    <a className="ui button teal" style={{width:"100%"}}>{i18n("Attach")}</a>
  )
}

class AddServiceNewOrOld extends React.Component{
  constructor(props){
    super(props)
    this.state={
      tab: 1
    }

    this.handleAttachService = (uuid) => {
      props
        .onAttachService(props.project, uuid)
        .then( () => goto(`/project/${props.project}/services/${uuid}`))
    }
  }
  componentDidMount(){
    let self = this
    $(this.refs.checkboxes).find('.checkbox').checkbox({
      onChange(ev){
        console.log("Enable %o", this)
        self.setState({tab: this.value})
      }
    })
  }
  render(){
    const props = this.props
    const tab = this.state.tab
    const {service} = props
    const my_type = service.type
    const my_project = props.project
    return (
      <div className="ui extend">
        <div className="ui padding" style={{paddingBottom:0}}>
          <h2>{i18n("Add {service_type} service to project", {service_type: service.name})}</h2>
          <div className="ui form">
            <div className="inline fields" ref="checkboxes">
              <div className="field">
                <div className="ui radio checkbox">
                  <input name="new_or_create" value="1" type="radio" checked={tab==1 && "checked"}/>
                  <label>{i18n("Create new")}</label>
                </div>
              </div>
              <div className="field">
                <div className="ui radio checkbox">
                  <input name="new_or_create" value="2" type="radio" checked={tab==2 && "checked"}/>
                  <label>{i18n("Select existing")}</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="ui with scroll">
        {tab == 1 ? (
          <AddServiceDetailsForm {...props}/>
        ) : (
          <div className="ui padding extend">
            <div className="description">
              {i18n("This services are used on other projects but may be attached to the current one, so they will be shared between the projects.")}
            </div>
            <div className="ui separator" style={{height: 10}}/>
            <ServiceSelect
              filter={(s) => s.type == my_type && s.projects.indexOf(my_project)<0 }
              onBack={() => gotoStep(1)}
              onSelect={(s) => attach_service(s.uuid)}
              bottomElement={AddServiceButton}
              />
          </div>
        )}
        </div>
      </div>
    )
  }
}

function get_service_market_catalog(){
  return Promise.all([
      plugin.start_call_stop(
            "serverboards.optional.update/updater",
            "component_filter",
            {type: "service"}
          )
      , cache.plugins()
    ]).then( (cp) => {
      const catalog = cp[0]
      const plugin_list = cp[1]

      console.log("Got catalog %o // %o", catalog, plugin_list)
      return catalog.filter( c => !plugin_list[c.plugin] )
    })
}

class ServiceFromExistingOrMarket extends React.Component{
  constructor(props){
    super(props)
    this.state={
      tab: 1
    }
  }
  render(){
    const props = this.props
    const tab= this.state.tab
    return (
      <div className="extend">
        <div className="ui padding">
          <h2 className="ui centered header">
            <i className={`icon cloud`}/>
            {i18n("Add a service to this project")}
          </h2>
          <div>
            {i18n("First select the service type. If not available at the already installed services, there are many more available to install at the marketplace.")}
          </div>
        </div>
        <div className="ui separator" style={{height:10}}/>
        <div className="ui pointing secondary menu">
          <a className={`item ${tab==1 ? "active" : ""}`} onClick={() => this.setState({tab:1})}>
            {i18n("Available services")}
          </a>
          <a className={`item ${tab==2 ? "active" : ""}`} onClick={() => this.setState({tab:2})}>
            {i18n("Marketplace")}
          </a>
        </div>
        { tab==1 ? (
          <Selector
            key="installed"
            get_items={cache.service_catalog}
            onSelect={(what) => props.onSelectServiceType(what)}
            current={(props.service || {}).type}
            />
        ) : (tab == 2) ? (
          <Selector
            key="marketplace"
            get_items={get_service_market_catalog}
            current={(props.service || {}).type}
            onSelect={(s) => {
              this.setState({tab:3})
              plugin.install(s.giturl).then(() => {
                s = {...s, type: s.id} // I need the component id in the type field.
                props.onSelectServiceType(s)
              }).catch((e) => {
                console.error(e)
                this.setState({tab:2})
                Flash.error(i18n("Error installing *{plugin}*. Please try again or check logs.", {plugin:s.name}))
              })
            }}
            />
        ) : (
          <Loading>{i18n("Installing the required add-on")}</Loading>
        ) }
      </div>
    )
  }
}

class AddService extends React.Component{
  constructor(props){
    super(props)
    this.state={
      step: 1,
      service: undefined,
    }
  }
  handleSelectServiceType(service){
    this.setState({step:2, service})
  }
  render(){
    var section = null
    switch (this.state.step){
      case 1:
        section = (
          <ServiceFromExistingOrMarket
            onSelectServiceType={(s) => this.handleSelectServiceType(s)}
            service={this.state.service}
            {...this.props}
            />
        )
        break;
      case 2:
        section = (
          <AddServiceNewOrOld
            service={this.state.service}
            gotoStep={(step) => this.setState({step})}
            project={this.props.project.shortname}
            onAddService={this.props.onAddService}
            onAttachService={this.props.onAttachService}
            />)
        break;
    }

    return (
      <div className="ui expand two column grid grey background" style={{margin:0}}>
        <div className="ui column">
          <div className="ui round pane white background with padding">
            <img src={require("imgs/024-illustration-addaddons.svg")} style={{height: 150}}/>
            <h2 className="ui header centered">{i18n("Add Services to your project.")}</h2>
            <img src={require("imgs/019-illustration-tips.svg")} style={{height: 80}}/>
            <div className="ui text container">
              <h3 className="ui header centered">
                {i18n("Add services you are already subscribed to manage, monitor or automate tasks with them.")}
              </h3>
              <div className="ui content">
              <MarkdownPreview value={i18n(`
Serverboards core elements are services. Services are definitions of how to connect
to services and servers. This may mean required credentials, url addresses and so
on.

Here you can select the type of service you want to add, or check out at the store
to find more service types to use in Serverboards.
`)}/>
              </div>
            </div>
          </div>
        </div>

        <div className="ui column">
          <div className="ui round pane white background">
            {section}
          </div>
        </div>
      </div>
    )
  }
}


export default AddService
