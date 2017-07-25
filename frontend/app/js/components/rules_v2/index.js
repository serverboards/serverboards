import React from 'react'
import i18n from 'app/utils/i18n'
import { goto } from 'app/utils/store'
import Rule from 'app/containers/rules_v2/rule'
import { sort_by_name } from 'app/utils'

const Rules = React.createClass({
  gotoRule(rule){
    const project = this.props.project.shortname
    goto(`/project/${project}/rules_v2/${rule.uuid}`)
  },
  render(){
    if (this.props.subsection){
      const subsection = this.props.subsection
      const rule = this.props.rules.find( r => r.uuid == subsection)
      return (
        <Rule {...this.props} rule={rule}/>
      )
    }

    const rules = sort_by_name(this.props.rules || [])
    return (
      <div className="ui padding container">
        <div className="ui rule cards">
        {rules.map( (r) => (
          <div key={r.uuid} className="rule card">
            <div className="header">
              <h3 className="ui header">{r.name}</h3>
            </div>
            <div className="content">
              {r.description}
            </div>

            <div className="extra content">
              <div className={`ui inverted ${ r.is_active ? 'teal' : 'grey'} menu bottom attached`}>
                <a className="ui right item" style={{marginRight: 10}}  onClick={() => this.gotoRule(r)} >
                  {i18n("Details")} <i className="ui angle right icon"/>
                </a>
              </div>
            </div>
          </div>
        ) ) }
      </div>
    </div>
    )
  }
})

export default Rules
