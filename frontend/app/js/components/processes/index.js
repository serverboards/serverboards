import React from 'react'
import Loading from '../loading'
import rpc from 'app/rpc'
import store from 'app/utils/store'
import {push} from 'react-router-redux'
import {i18n, i18n_nop} from 'app/utils/i18n'

const class_for_status={
  "": "",
  "error": "negative",
  "aborted": "negative",
  "running": "positive"
}

i18n_nop("ok")
i18n_nop("error")
i18n_nop("aborted")
i18n_nop("running")

function ProcessesHistory(props){
  let processes=props.processes

  if (props.loading)
    return (
      <Loading>{i18n("Process history")}</Loading>
    )

  return (
    <div className="ui split vertical area">
      <div className="ui top secondary menu">
        <h3 className="ui header">{i18n("Process history")}</h3>



        <div className="item stretch"/>
        {i18n("Showing {start}-{end} of {total}", {start: props.startn, end: props.startn+processes.length-1, total: props.count})} |
        <div className="item separator"/>
        <a onClick={props.handleFirstPage} className="item">{i18n("First page")}</a>
        <a onClick={props.handleNextPage} className="item">{i18n("Next page")}</a>

      </div>
      <div className="expand with scroll and padding">
        <div className="ui text container">
          <table className="ui very basic selectable table">
            <thead>
              <tr>
                <th>{i18n("Date")}</th>
                <th>{i18n("Elapsed")}</th>
                <th>{i18n("Action")}</th>
                <th>{i18n("User")}</th>
                <th>{i18n("Status")}</th>
              </tr>
            </thead>
            <tbody>
              {processes.map( (p) => (
                <tr key={p.uuid} className={i18n(class_for_status[p.status])}
                    onClick={() =>{ store.dispatch( push(`/process/${p.uuid}`) ) }}
                    style={{cursor:"pointer"}}>
                  <td>{p.date.replace('T',' ')}</td>
                  <td>{p.elapsed || '--'} ms</td>
                  <td>{i18n(p.action)}</td>
                  <td>{p.user}</td>
                  <td>{i18n(p.status)}</td>
                  <td><a href={`#/process/${p.uuid}`}><i className="ui icon angle right"/></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProcessesHistory
