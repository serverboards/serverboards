import React from 'react'
import Loading from '../loading'
import rpc from 'app/rpc'
import store from 'app/utils/store'
import {push} from 'react-router-redux'

const class_for_status={
  "": "",
  "error": "negative",
  "aborted": "negative",
  "running": "positive"
}

let ProcessesHistory=React.createClass({
  render(){
    let processes=this.props.processes

    if (processes == undefined)
      return (
        <Loading>Process history</Loading>
      )

    return (
      <div className="ui central white background">
        <div className="ui text container">
          <h1 className="ui header">Process history</h1>

          <table className="ui very basic selectable table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Elapsed</th>
                <th>Action</th>
                <th>User</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {processes.map( (p) => (
                <tr key={p.uuid} className={class_for_status[p.status]}
                    onClick={() =>{ store.dispatch( push(`/process/${p.uuid}`) ) }}
                    style={{cursor:"pointer"}}>
                  <td>{p.date.replace('T',' ')}</td>
                  <td>{p.elapsed || '--'} ms</td>
                  <td>{p.action}</td>
                  <td>{p.user}</td>
                  <td>{p.status}</td>
                  <td><a href={`#/process/${p.uuid}`}><i className="ui icon angle right"/></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
}
})

export default ProcessesHistory
