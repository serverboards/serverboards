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
      console.log("Save %o %o", props.project, service)
      props.onAddService(props.project, service)
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
    <a className="ui button teal">{i18n("Attach to this project")}</a>
  )
}

function AddServiceNewOrOldTabs(props){
  const {tab, service, setTab, setStep} = props
  const my_type = service.type
  const my_project = props.project
  return (
    <div className="ui padding extend">
      <h2>{i18n("Add {service_type} service to project", {service_type: service.name})}</h2>
      <div className="ui pointing secondary menu">
        <a
          className={`item ${tab=="new" ? "active" : ""}`}
          onClick={() => setTab("new")}
          >Create new</a>
        <a
          className={`item ${tab=="existing" ? "active" : ""}`}
          onClick={() => setTab("existing")}
          >Select existing</a>
      </div>
      <div className="ui with scroll">
      {tab == "new" ? (
        <AddServiceDetailsForm {...props}/>
      ) : (
        <div className="ui padding extend">
          <ServiceSelect
            filter={(s) => s.type == my_type && s.projects.indexOf(my_project)<0 }
            onBack={() => gotoStep(1)}
            onSelect={(s) => console.log("Select %o",s)}
            bottomElement={AddServiceButton}
            />
        </div>
      )}
      </div>
    </div>
  )
}

function AddServiceHeader({openMarket}){
  return (
    <div className="menu">
      <div className="item stretch"></div>
      <a className="ui button teal" onClick={openMarket}>{i18n("Go to market")}</a>
    </div>
  )
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


class AddService extends React.Component{
  constructor(props){
    super(props)
    this.state={
      step: 1,
      service: undefined,
      tab: "new"
    }
  }
  handleSelectServiceType(service){
    this.setState({step:2, service})
  }
  componentDidMount(){
    this.props.setSectionMenu(AddServiceHeader)
    this.props.setSectionMenuProps({openMarket: () => this.setState({step: 10})})
  }
  componentWillUmount(){
    this.props.setSectionMenu(null)
    this.props.setSectionMenuProps({})
  }
  render(){
    var section = null
    switch (this.state.step){
      case 1:
        section = (<Selector
                    key="installed"
                    icon="cloud"
                    title={i18n("Create a new service")}
                    description={i18n("Select which service type to create")}
                    get_items={cache.service_catalog}
                    onSelect={(what) => this.handleSelectServiceType(what)}
                    current={(this.state.service || {}).type}
                    />)
        break;
      case 2:
        section = (<AddServiceNewOrOldTabs
                      service={this.state.service}
                      gotoStep={(step) => this.setState({step})}
                      tab={this.state.tab}
                      setTab={(tab) => this.setState({tab})}
                      project={this.props.project.shortname}
                      onAddService={this.props.handleAddService}
                      />)
        break;
      case 10:
        section = (<Selector
                    key="marketplace"
                    icon="cloud"
                    title={i18n("Install add-on")}
                    description={i18n("Select a service type from the Serverboards marketplace and it will be ready to use. Just one click.")}
                    get_items={get_service_market_catalog}
                    current={(this.state.service || {}).type}
                    onSkip={() => this.setState({step:1})}
                    skip_label={i18n("Back to already installed services")}
                    onSelect={(s) => {
                      this.setState({step:11})
                      plugin.install(s.giturl).then(() => {
                        this.handleSelectServiceType(s)
                      }).catch(() => {
                        this.setState({step:1})
                        Flash.error(i18n("Error installing *{plugin}*. Please try again or check logs.", {plugin:s.name}))
                      })
                    }}
                    />)
        break;
      case 11:
        section = <Loading>{i18n("Installing plugin")}</Loading>
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
