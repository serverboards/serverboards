import React from 'react'
import rpc from 'app/rpc'
import Modal from '../modal'

function levelToClass(level){
  if (level=="error")
    return "error"
  if (level=="warn")
    return "warning"
  if (level=="debug")
    return "debug"
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
  return (
    <tr className={levelToClass(line.level)} onClick={(ev) => { ev.preventDefault(); props.showDetails(line)}} style={{cursor:"pointer"}}>
      <td>{line.id}</td>
      <td>{line.level}</td>
      <td>{date}<br/>{time}</td>
      <td>{line.message.split('\n')[0]}</td>
      <td><i className="ui icon angle right"/></td>
    </tr>
  )
}

function Details(props){
  const line = props.line
  return (
    <Modal>
      <h2 className="ui header">Log line details</h2>
      <span className={`ui label ${levelToLabelClass(line.level)}`}>{line.level}</span>
      <h3 className="ui header uppercase">Date</h3>
      <div className="meta">{line.timestamp.replace('T',' ')}</div>


      <h3 className="ui header uppercase">Full Message</h3>
      <pre>
        {reformatMessage(line.message)}
      </pre>

      <h3 className="ui header uppercase">Metadata</h3>
      <pre>
        {JSON.stringify(line.meta,undefined, 2)}
      </pre>
    </Modal>
  )
}

const Logs = React.createClass({
  getInitialState(){
    return {
      count: undefined,
      lines: [],
      start: undefined,
      page: 1,
    }
  },
  componentDidMount(){
    this.refreshHistory()
  },
  refreshHistory(state={}){
    let filter={}
    if (state.start)
      filter.start=state.start

    rpc.call('logs.history', filter).then((history) => {
      this.setState({lines: history.lines, count: history.count, start: state.start, page: state.page || 1 })
    })
  },
  nextPage(ev){
    ev.preventDefault()
    if (this.state.lines.length==0)
      return

    let start=this.state.lines[this.state.lines.length-1].id
    console.log("Start list at %o", start)
    this.refreshHistory({start, page: this.state.page+1, lines: []})
  },
  refresh(ev){
    ev.preventDefault()
    this.refreshHistory({start: undefined, page: 1, lines: []})
  },
  showDetails(line){
    this.setModal("details", {line: line})
  },
  setModal(modal, data={}){
    this.context.router.push( {
      pathname: this.props.location.pathname,
      state: { modal, data }
    } )
  },
  closeModal(){
    this.setModal(false)
  },
  contextTypes: {
    router: React.PropTypes.object
  },
  render(){
    let popup=[]
    const modal = this.props.location.state || {}
    console.log(modal)
    switch(modal.modal){
      case 'details':
        popup=(
          <Details
            line={modal.data.line}
            />
        )
        break;
    }

    return (
      <div className="ui central area white background">
        <div className="ui container">
          <h1 className="ui header">Logs</h1>
          <div className="meta">{this.state.count} total log lines. Page {this.state.page}.</div>

          <div>
            <a href="#" onClick={this.nextPage}>Next</a> |
            <a href="#" onClick={this.refresh}>Refresh</a>
          </div>

          <table className="ui selectable table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Level</th>
                <th style={{width: "7em"}}>Date</th>
                <th>Message</th>
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
        {popup}
      </div>
    )
  }
})

export default Logs
