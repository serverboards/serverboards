import React from 'react'

const class_for_result={
  "": "",
  "error": "negative",
  "running": "positive"
}

function ProcessesHistory(props){
  console.log("Processes history %o", props)
  let all_processes=[
    {uuid: "123", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "running", user: "dmoreno@coralbits.com"},
    {uuid: "1234", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "ok", user: "dmoreno@coralbits.com"},
    {uuid: "1235", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "ok", user: "dmoreno@coralbits.com"},
    {uuid: "1236", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "ok", user: "dmoreno@coralbits.com"},
    {uuid: "1237", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "ok", user: "dmoreno@coralbits.com"},
    {uuid: "1238", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "ok", user: "dmoreno@coralbits.com"},
    {uuid: "1239", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "ok", user: "dmoreno@coralbits.com"},
    {uuid: "12311", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "error", user: "dmoreno@coralbits.com"},
    {uuid: "12312", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "ok", user: "dmoreno@coralbits.com"},
    {uuid: "12313", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "ok", user: "dmoreno@coralbits.com"},
    {uuid: "12314", date: "2016-05-27 18:33:33", elapsed: 2.0, action: "serverboards.core/ping", result: "ok", user: "dmoreno@coralbits.com"},
  ]
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
              <th>Result</th>
            </tr>
          </thead>
          <tbody>
            {all_processes.map( (p) => (
              <tr key={p.uuid} className={class_for_result[p.result]}>
                <td>{p.date}</td>
                <td>{p.elapsed} s</td>
                <td>{p.action}</td>
                <td>{p.user}</td>
                <td>{p.result}</td>
                <td><a href={`#/process/${p.uuid}`}><i className="ui icon angle right"/></a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProcessesHistory
