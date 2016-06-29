import React from 'react'
import Loading from '../loading'
import rpc from 'app/rpc'

let ProcessView=React.createClass({
  getInitialState(){
    return {
      loading: true,
      process: undefined
    }
  },
  componentDidMount(){
    console.log(this)
    rpc.call("action.history", [this.props.params.uuid] ).then( (process) => {
      this.setState({
        loading: false,
        process: process
      })
    })
  },
  render(){
    if (this.state.loading)
      return (
        <Loading>Process history</Loading>
      )

    let process = this.state.process

    console.log("Render %o", process)

    return (
      <div className="ui central white background">
        <div className="ui text container">
        <h1 className="ui header">{process.action}</h1>
        <div className="ui meta">{process.type}</div>
        <div className="ui meta">{process.uuid}</div>

        <ul>
          <li>Date: {process.date}</li>
          <li>User: {process.user}</li>
          <li>Elapsed: {process.elapsed} ms</li>
          <li>Execution status: {process.status}</li>
          <li>Action params:
            <code className="code json"><pre>{JSON.stringify(process.params, null, 2)}</pre></code>
          </li>
          <li>Action result:
            <code className="code json"><pre>{JSON.stringify(process.result, null, 2)}</pre></code>
          </li>
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
