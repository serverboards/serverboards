import React from 'react'
import connect from 'app/containers/connect'
import TopView from 'app/components/project/top'
import { project_update_all } from 'app/actions/project'
import _ from 'lodash'
import {merge, map_get} from 'app/utils'
import {i18n, i18n_nop} from 'app/utils/i18n'
import {match_traits} from 'app/utils'

const SECTIONS = [
  {id: 'dashboard', name: i18n_nop('Dashboard')},
  {id: 'services',  name: i18n_nop('Services'), perm: "service.get"},
  {id: 'rules_v2',  name: i18n_nop('Rules'), perm: "rules.view"},
  {id: 'settings',  name: i18n_nop('Settings'), perm: "project.update"},
  {id: 'issues',  name: i18n_nop('Issues'), perm: "issues.view"},
]

var Top=connect({
  state(state, props){
    let current_project = map_get(state, ["project", "project"]) || {}
    let extra_screens = current_project.screens || []
    const services = current_project.services || []

    extra_screens = extra_screens.map( s => (
      merge(s, {
        candidates: services.filter((c) => match_traits({all: c.traits, has: s.traits}))
      })
    ))
    extra_screens.sort( (a,b) => a.name.localeCompare(b.name) )
    const params = props.params
    const perms = state.auth.user.perms

    let sections = SECTIONS.filter( s => {
      if (!s.perm)
        return true
      return perms.indexOf(s.perm)>=0
    })

    if (perms.indexOf("plugin")>=0)
      sections = sections.concat(extra_screens)

    return {
      projects: _.sortBy(state.project.projects || [], 'name'),
      sections: sections,
      project_name: current_project.name,
      section: params.section || 'dashboard' ,
      subsection: params.subsection,
      project_shortname: current_project.shortname,
      service: params.service,
    }
  },
  subscriptions: ['project.created', 'project.removed'],
  store_enter: [project_update_all]
})(TopView)

export default Top
