import React from 'react'
import i18n from 'app/utils/i18n'
import {Tip} from 'app/components'

function maybe_submit(ev){
  if (ev.charCode==13){
    $('#project_name_submit').click()
  }
}

export function make_projectname(props){
  return {
    tip: (
      <Tip
        subtitle={i18n("Create projects to categorize clients, jobs, etc.")}
        description={i18n("Projects allows to have related services, rules and issues together.")}
        />
    ),
    work: (
      <div className="ui fill centered area">
        <h2 className="ui header">{i18n("Choose a name for your project")}</h2>
        <div className="ui form">
          <input type="text" placeholder={i18n("Name your project")} id="project_name" onKeyPress={maybe_submit}/>
          <button
            className="ui basic teal button"
            style={{marginTop: 30}}
            onClick={() => props.handleCreateProject($('input#project_name').val())}
            id="project_name_submit"
            >{i18n("Create and continue")}</button>
        </div>
      </div>
    )
  }
}
