import React from 'react'
import rpc from 'app/rpc'
import Modal from '../modal'
import Flash from 'app/flash'
import Loading from '../loading'
import {i18n, i18n_nop} from 'app/utils/i18n'
import {merge} from 'app/utils'
import Paginator from '../paginator'
import store from 'app/utils/store'

require('sass/table.sass')

i18n_nop("error")
i18n_nop("warn")
i18n_nop("debug")
i18n_nop("info")

function levelToClass(level){
  if (level=="error")
    return "error"
  if (level=="warn")
    return "warning"
  if (level=="debug")
    return "blue"
  return ""
}
function levelToLabelClass(level){
  if (level=="error")
    return "red"
  if (level=="warn")
    return "yellow"
  if (level=="debug")
    return "blue"
  return ""
}

function reformatMessage(msg){
  return msg.replace(/{/g,'{\n ').replace(/}/g,'\n}\n').replace(/\[/g,'[\n ').replace(/]/g,'\n]\n').replace(/,/g,',\n')
}

function LogLine(props){
  const line = props.line
  const datetime = line.timestamp.slice(0,19).split('T')
  const date = datetime[0]
  const time = datetime[1]
  const extra = line.meta || {}
  return (
    <tr className={levelToClass(line.level)} onClick={(ev) => { ev.preventDefault(); props.showDetails(line)}} style={{cursor:"pointer"}}>
      <td>{line.id}</td>
      <td>{extra.plugin_id || extra.module || "core"}</td>
      <td>{i18n(line.level)}</td>
      <td>{date}<br/>{time}</td>
      <td>{line.message.split('\n')[0]}</td>
      <td><i className="ui icon angle right"/></td>
    </tr>
  )
}

function pretty_print(el){
  if (typeof(el) == "object"){
    return (
      <pre className="ui code">
        {JSON.stringify(el, undefined, 2)}
      </pre>
    )
  }
  return el
}

function DataView({name, data}){
  if (name=="stdout" || name=="stderr" || name == "command"){
    return (
      <pre className="ui code" style={{paddingLeft:10}}>{data}</pre>
    )
  }
  else{
    return (
      <div style={{paddingLeft:10}}>{pretty_print(data)}</div>
    )
  }
}

function Details(props){
  const line = props.line

  const filename=line.meta.file
  const shortpath=filename.slice(filename.indexOf('serverboards/backend')+13)
  const related=`https://github.com/serverboards/serverboards/tree/master/${shortpath}#L${line.meta.line}`

  return (
    <Modal onClose={props.onClose}>
      <div className="ui top serverboards header menu with padding">
        <h2 className="ui header">{i18n("Log line details")}</h2>
        <div className="right menu">
          <span className={`ui label ${levelToLabelClass(line.level)}`}>{line.level}</span>
        </div>
      </div>
      <div className="ui content" style={{marginTop: 20}}>
        <h3 className="ui header uppercase">{i18n("Date")}</h3>
        <div className="meta">{line.timestamp.replace('T',' ')}</div>


        <h3 className="ui header uppercase">{i18n("Full Message")}</h3>
        <div>
          <pre className="ui code">
            {reformatMessage(line.message)}
          </pre>
        </div>

        <h3 className="ui header uppercase">{i18n("Metadata")}</h3>
        <div>
          {Object.keys(line.meta).map( (k) => (
            <div key={k}>
              <h4 className="ui header" style={{marginTop:10, marginBottom:0 }}>{k}</h4>
              <DataView name={k} data={line.meta[k]}/>
            </div>
          ))}

        </div>
        <h3 className="ui header uppercase">{i18n("Related")}</h3>
        <div>
          <h4 className="ui header" style={{marginTop:10, marginBottom:0 }}>Link</h4>
          <a href={related} target="_blank">{related}</a>
        </div>
      </div>
    </Modal>
  )
}

const Logs = React.createClass({
  getInitialState(){
    return {
      count: undefined,
      lines: [],
      page: 0,
      q: "",
      modal: undefined
    }
  },
  componentDidMount(){
    this.refreshHistory()
  },
  refreshHistory(state={}){
    let filter=merge({}, this.props.filter)
    if (state.page)
      filter.offset=state.page * 50

    const q=state.q || this.state.q
    if (q)
      filter.q=q

    this.lastfilter=filter
    this.setState({loading: true})
    rpc.call('logs.list', filter).then((history) => {
      if (this.lastfilter != filter){
        return
      }
      this.setState({loading: false})
      this.setState({lines: history.lines, count: history.count, page: state.page || 0 })
    }).catch( (e) => {
      console.log("Error loading log history: %o", e)
      Flash.error(i18n("Can't load log history."))
      this.setState({loading: false})
      this.setState({lines: [], count: 0, page: state.page || 0 })
    })
  },
  showDetails(line){
    this.setState({modal: line})
  },
  closeModal(){
    this.setState({modal: undefined})
  },
  handleQChange(ev){
    if (this.q_timeout)
      clearTimeout(this.q_timeout)
    const value = ev.target.value
    this.q_timeout = setTimeout(() => {
      this.setState({q: value})
      this.refreshHistory({q: value})
      this.q_timeout = undefined
    }, 200)
  },
  handlePageChange(page){
    this.setState({page})
    this.refreshHistory({page})
  },
  render(){
    if (this.state.count == undefined ){
      return (
        <Loading>{i18n("Logs")}</Loading>
      )
    }
    let popup=[]
    if (this.state.modal){
      popup=(
        <Details
          line={this.state.modal}
          onClose={() => this.closeModal()}
          />
      )
    }

    return (
      <div className="ui expand split vertical area">
        <div className="ui serverboards stackable top menu">
          <div className="ui item with info">
            <h3>{i18n("Logs")}</h3>
            <div className="meta">{i18n("{count} log lines.", {count: this.state.count})}</div>
          </div>

          <div className="item">
            <div className="ui search">
              <div className="ui icon input" style={{width:"100%"}}>
                <input className="prompt" type="text" placeholder="Search here..." onChange={this.handleQChange} defaultValue={this.state.q}/>
                {this.state.loading ? (
                  <i className="loading spinner icon"></i>
                ) : (
                  <i className="search icon"></i>
                )}
              </div>
            </div>
          </div>
          <div className="item stretch"/>
          <div className="item" style={{marginTop:12, marginBottom: 20}}>
            <Paginator count={Math.ceil(this.state.count/50.0)} current={this.state.page} onChange={this.handlePageChange} max={5}/>
          </div>
        </div>


        <div className="expand with scroll and padding">
          <div className="ui container">
            <table className="ui selectable table">
              <thead>
                <tr>
                  <th>{i18n("Id")}</th>
                  <th>{i18n("Module")}</th>
                  <th>{i18n("Level")}</th>
                  <th style={{width: "7em"}}>{i18n("Date")}</th>
                  <th>{i18n("Message")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {this.state.lines.map((l) => (
                  <LogLine key={l.id} line={l} showDetails={this.showDetails}/>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {popup}
      </div>
    )
  }
})

export default Logs
