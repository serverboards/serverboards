import React from 'react'
import Loading from '../loading'
import rpc from 'app/rpc'

let ProcessView=React.createClass({
  render(){
    let process = this.props.process
    if (!process)
      return (
        <Loading>Process history</Loading>
      )

    let label_color=""
    switch(process.status){
      case "running":
        label_color="olive"
        break;
      case "error":
        label_color="red"
        break;
      case "aborted":
        label_color="orange"
        break;
      case "ok":
        label_color="green"
        break;
    }

    return (
      <div className="ui central white background">
        <div className="ui text container">
        <h1 className="ui header">{process.action}</h1>
        <span className={`ui label ${label_color}`} style={{float:"right"}}>{process.status}</span>
        <div className="ui meta">{process.type}</div>
        <div className="ui meta">{process.uuid}</div>

        <ul>
          <li>Date: {process.date}</li>
          <li>User: {process.user}</li>
          {process.params ? (
            <li>Action params:
              <pre className="ui code json">{JSON.stringify(process.params, null, 2)}</pre>
            </li>
          ) : []}
          {process.elapsed ? (
              <li>Elapsed: {process.elapsed} ms</li>
            ) : []}
          {process.result ? (
            <li>Action result:
            <pre className="ui code json">{JSON.stringify(process.result, null, 2)}</pre>
            </li>
          ) : []}
        </ul>

        <div className="ui fixed bottom">
          <a href="#/process/history"
          className="ui header medium link">
          Process history <i className="ui icon angle right"/>
          </a>
        </div>
        </div>
      </div>
    )
  }
})

export default ProcessView
