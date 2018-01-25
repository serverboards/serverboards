import React from 'react'
import Loading from 'app/components/loading'
import GenericForm from 'app/components/genericform'
import rpc from 'app/rpc'
import Modal from 'app/components/modal'
import Error from 'app/components/error'
import HoldButton from 'app/components/holdbutton'
import Flash from 'app/flash'
import {set_modal} from 'app/utils/store'
import i18n from 'app/utils/i18n'
import QueryServiceSelect from 'app/containers/project/board/queryserviceselect'
import Widget from 'app/containers/project/board/widget'
import {map_get} from 'app/utils'
import {MarkdownPreview} from 'react-marked-markdown'

class EditWidget extends React.Component{
  constructor(props){
    super(props)
    const config = this.props.widget.config || {}
    this.state = {
      widget: undefined,
      extractors: config.__extractors__ || [],
      config: this.props.widget.config,
      postconfig: {},
      postconfig_timer: undefined,
      errors: [],
    }
    this.delayConfigUpdate()
  }
  handleSaveChanges(){
    const state=this.state
    const props=this.props
    const data={
      uuid: props.widget.uuid,
      widget: props.widget.widget,
      project: this.props.project,
      config: {...state.config, "__extractors__": state.extractors},
    }
    this.props.saveWidget(data)
  }
  removeWidget(){
    // console.log("remove", this.props.widget_id, this.props.widget.uuid)
    rpc.call("dashboard.widget.remove", [this.props.widget.uuid]).then(() => {
      set_modal(null)
      Flash.success("Widet removed")
    }).catch( e => {
      console.error(e)
      Flash.error("Could not remove widget.")
    })
  }
  setFormData(config){
    this.delayConfigUpdate()
    this.setState({config})
  }
  delayConfigUpdate(){
    let postconfig_timer = this.state.postconfig_timer
    if (postconfig_timer)
      clearTimeout(postconfig_timer)
    postconfig_timer = setTimeout( () => {
        this.fakeWidgetExtract()
        this.setState({postconfig_timer: undefined})
      }, 300 )
    this.setState({postconfig_timer})
  }
  fakeWidgetExtract(){
    // fake do as dashboard.widget.extract, to show at widget preview
    let postconfig = {}
    let context = {}
    for (const ext of this.state.extractors){
      context[ext.id]={ extractor: ext.extractor, service: ext.service, config: ext.config }
    }
    const config = this.state.config

    for (const p of map_get(this.props, ["template","params"], [])){
      let value = config[p.name]
      if (p.type=="query"){
        value = rpc.call("query.query", {query: value, context}).then( res => {
          let postconfig = {...this.state.postconfig}
          postconfig[p.name] = res
          // console.log("Set postconfig: [%o] = %o ", p.name, res)
          this.setState({postconfig})
        }).catch( e => {
          // console.error("Error getting postconfig: ", value, e)
          let postconfig = {...this.state.postconfig}
          postconfig[p.name] = {error: e}
          let errors = this.state.errors.concat(e)
          this.setState({postconfig, errors})
        })
        postconfig[p.name] = {loading: true}
      }
      else
        postconfig[p.name] = value
    }

    this.setState({postconfig, errors: []})
  }
  hasQuery(){
    return this.props.template && this.props.template.params && this.props.template.params.find( t => t.type == "query" ) != undefined
  }
  updateQueryParams(params){
    if (!params)
      return
    return params.map( p => {
      if (p.type=='query'){
        return {...p, type: "textarea"} // TODO data for autocomplete and so on.
      }
      return p
    })
  }
  handleSetExtractors(extractors){
    this.setState({ extractors })
    this.delayConfigUpdate()
  }
  render(){
    const template = this.props.template


    if (template=="not-found"){
      return (
        <Modal className="wide">
          <div className="ui top serverboards secondary menu">
            <h3 className="ui header">{this.props.widget_id}</h3>
            <div className="right menu">
              <HoldButton className="item" onHoldClick={this.removeWidget.bind(this)}>{i18n("Remove")} <i className="ui icon trash"/></HoldButton>
            </div>
          </div>
          <div className="ui text container">
            <Error>
              {i18n("Could not load information about this widget. Maybe the plugin was deleted?\n\nTry to install it again, or remove the widget.")}
            </Error>
          </div>
        </Modal>
      )
    }

    const widget = this.props.widget
    const state = this.state
    let layout={x:0, y:0, h: 2, w: 2, minW: 1, minH: 1}

    if (!template){
      return (
        <Modal>
          <Loading>{i18n("Widget description")}</Loading>
        </Modal>
      )
    }
    if (template.traits && template.traits.minH){
      layout={...layout, ...template.traits}
    }
    layout = {...layout, ...widget.ui}
    layout.width = layout.w
    layout.height = layout.h
    const wwidth = layout.w*283
    const wheight = (layout.h*130)+((layout.h-1)*28)
    return (
      <Modal className="wide">
        <div className="ui top serverboards secondary menu">
          <h3 className="ui header">{template.name}</h3>
          <div className="right menu">
            <HoldButton className="item" onHoldClick={this.removeWidget.bind(this)}>{i18n("Remove")} <i className="ui icon trash"/></HoldButton>
          </div>
        </div>
        <div className="ui expand two column grid grey background">
          <div className="ui column with scroll with padding">
            <div className="ui board">
              <div className="ui cards" style={{margin: 0, padding: "1em", justifyContent: "center"}}>
                <div className="ui card" style={{maxHeight: wheight, minHeight: wheight, maxWidth: wwidth, minWidth: wwidth }}>
                  <Widget
                    key={widget.uuid}
                    widget={widget.widget}
                    config={state.postconfig}
                    uuid={widget.uuid}
                    project={this.props.project}
                    layout={layout}
                    />
                </div>
              </div>
              {state.errors.map( e => (
                <MarkdownPreview key={e} className="ui red bold text" value={String(e)}/>
              ))}
            </div>
          </div>
          <div className="ui column">
            <div className="ui round pane white background with padding and scroll">
              <h2 className="ui centered header">{template.name}</h2>
              <MarkdownPreview value={template.description}/>

              <div className="ui form" ref="form">
                {state.error ? (
                  <div className="ui message visible error">
                    <div className="header">{i18n("Error")}</div>
                    <p>{state.error}</p>
                  </div>
                ) : (
                  <div>
                    <div className="ui meta" style={{marginBottom:30}}>{widget.description}</div>
                    {this.hasQuery() && (
                      <div className="">
                        <QueryServiceSelect
                          extractors={state.extractors}
                          onSetExtractors={this.handleSetExtractors.bind(this)}
                          />
                      </div>
                    )}

                    <GenericForm fields={this.updateQueryParams(template.params)} data={state.config} updateForm={this.setFormData.bind(this)}/>
                    <button className="ui button yellow" style={{marginTop:20}} onClick={this.handleSaveChanges.bind(this)}>
                      {i18n("Update widget")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    )
  }
}

export default EditWidget
