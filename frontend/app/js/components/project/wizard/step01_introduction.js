import React from 'react'
import i18n from 'app/utils/i18n'
import {Tip} from 'app/components'

const STYLE_IMG={
  width: 300,
}

export function make_introduction(props){
  return {
    tip: (
      <div className="ui padding with scroll">
        <h1 className="ui centered header" style={{marginBottom: 50}}>{i18n("This is how Serverboards works.")}</h1>
        <div className="ui two column grid">
          <div className="row">
            <div className="ui column text centered">
              <img src={require("imgs/020-illustration-noprojects01.svg")} style={STYLE_IMG}/>
            </div>
            <div className="column">
              <h2 className="ui black text header">{i18n("Monitorize your servers and cloud apps")}</h2>
              <h3 className="ui header" style={{marginTop: 0}}>{i18n("Fast insights into your project state")}</h3>
              {i18n("At the Serverboards dashboard you can access to insights of current real time state of your infrastrucure or your Key Perfomance Indicators.")}
            </div>
          </div>

          <div className="row">
            <div className="ui column text centered">
              <img src={require("imgs/021-illustration-noprojects02.svg")} style={STYLE_IMG}/>
            </div>
            <div className="column">
              <h2 className="ui black text header">{i18n("Manage your IT infrastructure and services")}</h2>
              <h3 className="ui header" style={{marginTop: 0}}>{i18n("Access to all you infrastrucure from one place")}</h3>
              {i18n("Instead of jumping around to all the diferent services, servers and cloud apps, use Serverboards to access from one place to all your infrastructure for most common tasks.")}
            </div>
          </div>

          <div className="row">
            <div className="ui column text centered">
              <img src={require("imgs/022-illustration-noprojects03.svg")} style={STYLE_IMG}/>
            </div>
            <div className="column">
              <h2 className="ui black text header">{i18n("Automate tasks and workflows")}</h2>
              <h3 className="ui header" style={{marginTop: 0}}>{i18n("Do not repeat your self and automate to simplify workloads")}</h3>
              {i18n("Day to day tasks are highly automatable. No need to do manually what a computer can do with no hastle, no human error and no cost. Exceptional situations are also better managed in an automated proactive way, so there is no time wasted on solving usual problems.")}
            </div>
          </div>
        </div>
      </div>
    ),
    work: (
      <div className="ui fill area centered">
        <h3>{i18n("Start by creating your first project")}</h3>
        <button className="ui teal button" onClick={() => props.nextStep()} id="create_project">{i18n("CREATE PROJECT")}</button>
      </div>
    )
  }
}
