import React from 'react'
import i18n from 'app/utils/i18n'

const Rules = React.createClass({
  render(){
    const rules = this.props.rules || []
    return (
      <div className="ui padding container">
        <div className="ui rule cards">
        {rules.map( (r) => (
          <div className="rule card">
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
