import React from 'react'
import {MarkdownPreview} from 'react-marked-markdown'
import cache from 'app/utils/cache'
import plugin from 'app/utils/plugin'
import i18n from 'app/utils/i18n'
import {map_get, object_is_equal} from 'app/utils'

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
      // console.log(this.props)
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
          <div key={table} className="ui double padding left" style={{marginTop: 10}}>
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
          {i18n("You can add extractors to access remote data using USQ queries. Help on each extractor will be shown here.")}
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

export default ExtractorsHelp
