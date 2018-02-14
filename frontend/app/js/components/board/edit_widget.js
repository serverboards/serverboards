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

class ExtractorHelp extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      extractor: {},
      tables: undefined,
      open_table: undefined
    }
  }
  componentDidMount(){
    const eid = this.props.extractor
    const config = this.props.config
    cache
      .plugin_component({type: "extractor"})
      .then( exts => exts.find( e => e.id == eid))
      .then( extractor => {
        // console.log("found data: ", extractor)
        this.setState({extractor})
        return plugin
          .start_call_stop(extractor.extra.command, extractor.extra.schema, [{config}, null])
          .then( tables => ({tables, extractor}))
      }).then( ({tables, extractor}) => {
        return Promise.all(
          tables.map( table =>
            plugin
              .start_call_stop(extractor.extra.command, extractor.extra.schema, [{config}, table])
              .then( schema => ({table, schema}))
          ) )
      }).then( tables => {
        this.setState({tables})
      })
  }
  onOpenTable(table){
    if (table == this.state.open_table)
      table = undefined
    this.setState({open_table: table})
  }
  render(){
    const {open_table, extractor, tables} = this.state
    if (!tables){
      console.log(this.props)
      return (
        <div>
          <i className="spinner loading icon"/>
          {this.props.extractor.extractor || i18n("Loading {extractor} data", {extractor: this.props.extractor})}
        </div>
      )
    }

    return (
      <div>
        <h4 className="ui header no margin">
          <span className="ui bold">{this.props.id}: </span>
          {extractor.name}
        </h4>
        {extractor.description && (
          <MarkdownPreview value={extractor.description} className="ui padding top down"/>
        )}
        {tables.map( ({table, schema}) => (
          <div key={table} className="ui double padding left">
            <h5 className="ui pointer" onClick={() => this.onOpenTable(table)}>
              {(open_table == table) ? (
                <i className="ui caret down icon"/>
              ) : (
                <i className="ui caret right icon"/>
              )}
              {table}
              {schema.description && (<span className="ui meta">-- {schema.description}</span>)}
            </h5>
            {(open_table == table) && (
              <ul>
              {(schema.columns || []).map( column => (
                <li key={column}>
                  {column.name ? (
                    <span>
                      {String(column.name)}
                        {column.type && `:${column.type}`}
                        {column.description && (<span className="ui meta">-- {column.description}</span>)}
                      </span>
                  ) : (
                    String(column)
                  )}
                </li>
              ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    )
  }
}

class ExtractorsHelp extends React.Component{
  shouldComponentUpdate(nextprops){
    return !object_is_equal(nextprops.extractors, this.props.extractors)
  }
  render(){
    const {extractors} = this.props
    // console.log(extractors)
    return (
      <div>
        <h3>{i18n("Extractors help")}</h3>
        {extractors.length==0 ? (
          <div>
          {i18n("You can add extractors to generate USQ queries on the right side. Help on each extractor will be shown here.")}
          </div>
        ) : undefined}
        {extractors.map( (e,i) => (
          <ExtractorHelp
            key={`${i}_${e.extractor}`}
            extractor={e.extractor}
            config={{...e.config, service: e.service}}
            id={e.id}
            />
        ))}
      </div>
    )
  }
}

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

    return (
      <div className="ui expand two column grid grey background" style={{margin: 0}}>
        <div className="ui column with scroll with padding">
          <div className="ui board with scroll">
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
            <hr className="ui separator"/>
            <ExtractorsHelp extractors={state.extractors}/>
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

export default EditWidget
