import React from 'react'
import i18n from 'app/utils/i18n'
import {Tip} from 'app/components'


export function make_introduction(props){
  return {
    tip: (
      <Tip
        title={i18n("Welcome to Serverboards")}
        description={i18n(`

  ## This how Serverboards works

  1. One

  2. Two

  3. Three
  `)}
      />
    ),
    work: (
      <div className="ui fill area centered">
        <h3>{i18n("Start by creating your first project")}</h3>
        <button className="ui teal button" onClick={() => props.nextStep()}>{i18n("CREATE PROJECT")}</button>
      </div>
    )
  }
}
