import React from 'react'
import connect from 'app/containers/connect'
import TopView from 'app/components/project/top'
import { project_update_all } from 'app/actions/project'
import _ from 'lodash'
import {merge, map_get} from 'app/utils'
import {i18n, i18n_nop} from 'app/utils/i18n'
import {match_traits} from 'app/components/service/utils'

const SECTIONS = [
  {id: 'dashboard', name: i18n_nop('Dashboard')},
  {id: 'services',  name: i18n_nop('Services')},
  {id: 'rules',  name: i18n_nop('Rules')},
  {id: 'settings',  name: i18n_nop('Settings')},
  {id: 'issues',  name: i18n_nop('Issues')},
]

var Top=connect({
  state(state, props){
    let current_project = map_get(state, ["project", "project"]) || {}
    let extra_screens = current_project.screens || []
    const services = current_project.services || []

    extra_screens = extra_screens.map( s => (
      merge(s, {
        candidates: services.filter((c) => match_traits(c.traits, s.traits))
      })
    ))
    extra_screens.sort( (a,b) => a.name.localeCompare(b.name) )
    const params = props.params

    return {
      projects: _.sortBy(state.project.projects || [], 'name'),
      sections: SECTIONS.concat(extra_screens),
      project_name: current_project.name,
      section: params.section || 'dashboard' ,
      subsection: params.subsection,
      project_shortname: current_project.shortname,
      service: params.service,
    }
  },
  subscriptions: ['project.created', 'project.removed']
})(TopView)

export default Top
