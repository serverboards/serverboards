import React from 'react'
import Loading from '../loading'
import rpc from '../../rpc'

const class_for_status={
  "": "",
  "error": "negative",
  "aborted": "negative",
  "running": "positive"
}

let ProcessesHistory=React.createClass({
  getInitialState(){
    return {
      processes: undefined,
      loading: true
    }
  },
  componentDidMount(){
    rpc.call("action.history", []).then((processes) => {
      this.setState({
        processes: processes,
        loading: false
      })
    })
  },
  render(){
    if (this.state.loading)
      return (
        <Loading>Process history</Loading>
      )

    let props=this.props
    console.log("Processes history %o", props)
    let processes=this.state.processes
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
                <tr key={p.uuid} className={class_for_status[p.status]}>
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
