import React from 'react'
import i18n from 'app/utils/i18n'

const img1 = require('app/../imgs/008-Button+.png')
const img2 = require('app/../imgs/016-mid-nocontent-rules.png')
const img3 = require('app/../imgs/017-right-nocontent-rules.png')

function Column({h1, t1, h2, t2, img}){
  return (
    <div className="column">
      <h2 className="ui header">{h1}</h2>
      <h3 className="ui grey header">{h2}</h3>
      <div>
        {t1}
      </div>
      <div style={{textAlign: "center", margin: "2em auto", height: 100}}><img src={img}/></div>
      <h2 className="ui small header">{i18n("TIP")}</h2>
      <div className="ui grey text">
        {t2}
      </div>
    </div>

  )
}

function Empty(props){
  return (
    <div className="ui container centered">
      <h1 className="ui centered grey huge header">{i18n("Automate process and create connections between services.")}</h1>
      <div className="ui grid three columns" style={{marginTop: 40}}>

        <Column
          h1={i18n("There rule IF > THEN style")}
          h2={i18n("Create rules connecting your services")}
          t1={i18n("Create as many rules as actions you want to automatize, from generete automatic backups at a set time, start anew server when the traffic reaches a threeshold limit, or get a Telegram notification when a client uploads a document to Google Drive.")}
          t2={i18n("In each project you can create as many rules as you want. To ease searc f rules use the provided filters.")}
          img={img1}
          />

        <Column
          h1={i18n("Greater productivity and control")}
          h2={i18n("Automate the most common processes")}
          t1={i18n("The most important quality of the rules is to help you on your daily job, by easing the automation of your most common process.")}
          t2={i18n("To improve your workflow you can not only automate usual process, but also open and close issues for out of the ordinary situations.")}
          img={img2}
          />

        <Column
          h1={i18n("Multiple connections to do more")}
          h2={i18n("The limit is your imagination")}
          t1={i18n("Using the same service and trigger you can perform several actions. Combining the service with other you achieve goals with each rule. Compine a trigger with a service for a goal, and with another for a related action.")}
          t2={i18n("If you want to automate for example to redo a backup, and open an issue when a backup fails, create two diferent rule, each for each action. For example Backup + Repeat and Backup + Open/Close Issue.")}
          img={img3}
          />

      </div>
    </div>
  )
}

export default Empty
