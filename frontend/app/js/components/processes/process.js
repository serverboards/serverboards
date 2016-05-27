import React from 'react'

function ProcessView(props){
  let process = {uuid: "123", date: "2016-05-27 18:33:33", elapsed: 2.0,
    action: "serverboards.core/ping", result: "running",
    user: "dmoreno@coralbits.com",
    results: { ms: 1000, http_code: 200, body: "" },
    output: ""
  }

  console.log("Render %o", process)

  return (
    <div className="ui central white background">
      <div className="ui text container">
      <h1 className="ui header">{process.name}</h1>
      <div className="ui meta">{process.action}</div>
      <div className="ui meta">{process.uuid}</div>

      <ul>
        <li>Date: {process.date}</li>
        <li>Elapsed: {process.elapsed}</li>
        <li>Execution result: {process.result}</li>
        <li>Reason (if error): {process.reason || "--"}</li>
        <li>Action results:
          <code className="code json"><pre>{JSON.stringify(process.results, null, 2)}</pre></code>
        </li>
        <li>Output:
          <pre>{process.output}</pre>
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

export default ProcessView
