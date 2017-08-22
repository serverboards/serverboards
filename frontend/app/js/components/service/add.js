import React from 'react'
import i18n from 'app/utils/i18n'
import Selector from 'app/components/selector'
import GenericForm from 'app/components/genericform'
import cache from 'app/utils/cache'
import {MarkdownPreview} from 'react-marked-markdown'
import ServiceSelect from 'app/components/service/select'

require('sass/panes.sass')

function AddServiceDetailsForm({service, gotoStep, onSave}){
  return (
    <div className="ui with padding extend">
      <MarkdownPreview value={service.description}/>

      <div className="separator" style={{height: 40}}/>
      <GenericForm fields={service.fields}/>
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
            onClick={onSave}>
              {i18n("Save and Continue")}
          </button>
        </div>
      </div>
    </div>
  )
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
    console.log(service)
    this.setState({step:2, service})
  }
  render(){
    var section = null
    switch (this.state.step){
      case 1:
        section = (<Selector
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
