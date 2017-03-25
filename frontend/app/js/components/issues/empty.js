import React from 'react'
import i18n from 'app/utils/i18n'

const img1 = require('app/../imgs/008-Button+.png')
const img2 = require('app/../imgs/014-mid-nocontent-issues.png')
const img3 = require('app/../imgs/015-right-nocontent-issues.png')

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
      <h1 className="ui centered grey huge header">{i18n("Improve your projects using \"issues\"")}</h1>
      <div className="ui grid three columns" style={{marginTop: 40}}>

        <Column
          h1={i18n("Create issues for problems or tasks")}
          h2={i18n("Timelines for issues")}
          t1={i18n("An issue is a work unit created to make an improvement. Normally issues are used to record errors and can be used to manage the failure fix, but also can be used as a work task.")}
          t2={i18n("With issues you can assign a task with a releated project, aiding with the organization. Each issue can be followed in a timeline. But also each issue has its own page with details and comments to facilitate the colaboration and an improved issue management.")}
          img={img1}
          />

        <Column
          h1={i18n("Manual or autoamtic issues")}
          h2={i18n("Rules can create and close issues")}
          t1={i18n("Isses can be open manyally to better manage your project needs, but to ease your jobs they can also be created or closed using automatic rules.")}
          t2={i18n("To be able to close or open automatic issues you must create rules. Just select the trigger and the action to open or close the issue depending on your case. If one issue has related rules they will be properly linked from the issue details for quick access and modification.")}
          img={img2}
          />

        <Column
          h1={i18n("Filter by state, tags or project")}
          h2={i18n("Find quickly any issue")}
          t1={i18n("Given the great ammount of issues that can acummulate in short time, to be able to find your issue you can do it by state, project or even tags. Tags are used to state the main idea of each issue.")}
          t2={i18n("Set the tags for the issues from the issues details page. When creating a new issue its possible to mark te tags to ease the process from a listing, so you dont need to create it again each time.")}
          img={img3}
          />

      </div>
    </div>
  )
}

export default Empty
