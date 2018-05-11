import React from 'react'
import GenericForm from 'app/components/genericform'
import rpc from 'app/rpc'
import Error from 'app/components/error'
import Flash from 'app/flash'
import {set_modal} from 'app/utils/store'
import cache from 'app/utils/cache'
import plugin from 'app/utils/plugin'
import i18n from 'app/utils/i18n'
import QueryServiceSelect from 'app/containers/board/queryserviceselect'
import Widget from 'app/containers/board/widget'
import {map_get, object_is_equal} from 'app/utils'
import {MarkdownPreview} from 'react-marked-markdown'
import ExtractorsHelp from './extractorshelp'

class EditWidget extends React.Component{
  constructor(props){
    super(props)
    const config = map_get(this.props, ["widget", "config"], {})
    this.state = {
      widget: undefined,
      extractors: config.__extractors__ || [],
      config: config,
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
    context["__vars__"] = this.props.vars
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
          let errors = [...this.state.errors, e]
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
        return {...p, type: "textarea", mode: "sql"} // TODO data for autocomplete and so on.
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
        <div className="ui text container">
          <Error>
            {i18n("Could not load information about this widget. Maybe the plugin was deleted?\n\nTry to install it again, or remove the widget.")}
          </Error>
        </div>
      )
    }

    const widget = this.props.widget || {}
    const state = this.state

    let layout={x:0, y:0, h: 2, w: 2, minW: 1, minH: 1, maxW: 20, maxH: 20}
    if (typeof(template.hints) == "object"){
      layout={...layout, ...template.hints}
    }
    if (widget.ui)
      layout = {...layout, ...widget.ui}
    layout.h = Math.max(Math.min(layout.h, layout.maxH), layout.minH)
    layout.w = Math.max(Math.min(layout.w, layout.maxW), layout.minW)
    const wwidth = layout.w*140
    const wheight = (layout.h*163)
    layout.width = wwidth
    layout.height = wheight - 60

    return (
      <div className="ui expand two column grid grey background" style={{margin: 0}}>
        <div className="ui column with padding">
          <div className="ui vertical split" style={{maxHeight: "calc(100vh - 140px)", overflow: "hidden"}}>
            <div className="ui board with scroll" style={{flexDirection: "column", flex: 1, maxHeight: "calc(50vh - 70px)", minHeight: "calc(50vh - 70px)"}}>
              <div className="ui cards" style={{margin: 0, padding: "1em", justifyContent: "center", minWidth: wwidth+50, minHeight: 50}}>
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
            </div>
            {state.errors.map( e => (
              <SQLError key={e} error={e}/>
            ))}
            <hr className="ui separator"/>
            <div className="ui round pane white background scroll with padding" style={{flex: 1, maxHeight: "calc(50vh - 115px)", minHeight: "calc(50vh - 115px)"}}>
              <ExtractorsHelp extractors={state.extractors}/>
            </div>
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
                  <button className="ui button teal" style={{marginTop:20}} onClick={this.handleSaveChanges.bind(this)}>
                    {this.props.saveLabel || i18n("Update widget")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function dotnot(col){
  if (typeof(col) == 'string')
    return col
  return col.join('.')
}

function SQLError({error}){
  switch(error[0]){
    case "not_found":
      return (
        <div className="ui text red">
          <span className="ui text bold">{dotnot(error[1])}</span>
          &nbsp;{i18n("not found in")}&nbsp;
          <ul>
            {error[3].map( col => (
              <li key={col}>{dotnot(col)}</li>
            ))}
          </ul>
        </div>
      )
      break;
      case "syntax":
        console.log("syntax error")
        return (
          <div className="ui text red">
            {i18n("Syntax error at line {line}: {error}", {line: error[1][1], error: error[1][0]})}
          </div>
        )
        break;
  }
  console.log("Original SQL error: ", error)
  return (
    <div className="ui text red bold">JSON.stringify(error)</div>
  )
}

export default EditWidget
