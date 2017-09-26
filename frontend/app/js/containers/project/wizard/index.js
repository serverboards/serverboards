import React from 'react'
import {Panes, Tip, Error} from 'app/components'
import {make_introduction} from 'app/components/project/wizard/step01_introduction'
import {make_projectname} from 'app/components/project/wizard/step02_projectname'
import {make_widgets} from 'app/containers/project/wizard/step03_widgets'
import {make_services} from 'app/containers/project/wizard/step04_services'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import i18n from 'app/utils/i18n'
import store from 'app/utils/store'
import cache from 'app/utils/cache'
import {projects_set_current} from 'app/actions/project'
import {map_get} from 'app/utils'


function make_shortname(name){
  let shortname = name
  if (shortname.length>5)
    shortname = shortname.replace(/[aeiou]/gi,"")
  if (shortname.length>5)
    shortname=shortname.slice(0,2) + shortname.slice( shortname.length - 3)
  shortname=shortname.toUpperCase()
  return shortname
}

class WizardModel extends React.Component{
  constructor(props){
    super(props)

    this.state= {
      step: map_get(this.props, ["location","state","step"]) || 0,
      project: undefined
    }
    this.funcs = {
      nextStep: () => {
        if (this.state.step==3)
          store.goto(`/project/${this.state.project}/`)
        else
          this.setState({step: this.state.step+1})
      },
      prevStep: () => this.setState({step: this.state.step-1}),
      handleCreateProject: (name) => {
        const shortname = make_shortname(name)
        cache.project(shortname).then( p => {
          if (p)
            Flash.error(i18n("Project shortname {shortname} already exist. Try another project name.",{shortname}))
          else{
            return rpc
              .call("project.create", {shortname, name })
              .then((uuid) => {
                this.setState({project: shortname})
                store.dispatch( projects_set_current(shortname) )
                this.funcs.nextStep()
              })
          }
        })
      }
    }
  }
  make_step(){
    const props = {...this.state, ...this.props, ...this.funcs}
    switch(this.state.step){
      case 0:
        return make_introduction(props)
      case 1:
        return make_projectname(props)
      case 2:
        return make_widgets(props)
      case 3:
        return make_services(props)
    }
    return (
      <Error>
        {i18n("Unknown wizard step")}
      </Error>
    )
  }
  render(){
    const next_step = this.make_step()
    const {tip, work} = next_step

    if (tip){
      return (
        <Panes column1={tip} column2={work}/>
      )
    }
    else{
      return next_step // its a full main area component
    }

  }
}

export default WizardModel
