import React from 'react'
import i18n from 'app/utils/i18n'
import Restricted from 'app/restricted'
import { set_modal, goto } from 'app/utils/store'

require("sass/project.sass")

class AddButton extends React.Component{
  constructor(props){
    super(props)
    this.state={
      open: false
    }
  }
  render(){
    const set_modal_and_close = (modal, data) => {
      set_modal(modal, data)
      this.setState({open: false})
    }

    if (this.state.open){
      const project = this.props.project
      return (
        <div className="ui floating bottom right add">
        {/*          <a
              onClick={this.openAddServiceModal}
              title={i18n("Add tool")}
              >
            <i className="ui massive button red tools icon"></i>
            <div className="ui clear background">{i18n("Add tool")}</div>
          </a>
          */}
          <Restricted perm="service.create">
            <a
                onClick={() => goto(`/project/${project}/services/add`)}
                title={i18n("Add a service")}
                className="ui double margin left"
                >
              <div className="ui circular button blue">
                <i className="id card outline white icon"></i>
              </div>
              <div className="ui clear background black bold uppercase centered text">{i18n("Add service")}</div>
            </a>
          </Restricted>
          <Restricted perm="rules.create">
            <a
                onClick={() => goto(`/project/${project}/rules_v2/add`)}
                title={i18n("Add a rule")}
                className="ui double margin left"
                >
              <div className="ui circular button violet">
                <i className="lab white icon"></i>
              </div>
              <div className="ui clear background black bold uppercase centered text">{i18n("Add rule")}</div>
            </a>
          </Restricted>
          <Restricted perm="dashboard.create">
            <a
                onClick={() => goto(`/project/${project}/dashboard/add`)}
                title={i18n("Add a widget")}
                className="ui double margin left"
                >
              <div className="ui circular button yellow">
                <i className="area chart white icon"></i>
              </div>
              <div className="ui clear background black bold uppercase centered text">{i18n("Add widget")}</div>
            </a>
          </Restricted>
          <a
            onClick={() => this.setState({open:false})}
            className="ui double margin left"
            >
            <div className="ui circular button grey">
              <i className="remove white icon"></i>
            </div>
            <div className="ui clear background black bold uppercase centered text">{i18n("Back")}</div>
          </a>
        </div>
      )
    }
    else{
      return (
        <div className="ui floating bottom right add nofullscreen">
          <a
              onClick={() => this.setState({open:true})}
              title={i18n("Add a widget, service, rule, issue...")}
              >
            <div className="ui circular button teal">
              <i className="add white icon"></i>
            </div>
          </a>
        </div>
      )
    }
  }
}

export default AddButton
