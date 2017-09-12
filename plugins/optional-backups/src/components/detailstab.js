const {i18n, React, utils} = Serverboards
import Details from './details'
import Edit from '../containers/edit'

class DetailsTab extends React.Component{
  constructor(props){
    super(props)
    this.state={tab: "details", backup: props.backup}
  }
  gotoTab(tab, backup){
    this.setState({tab})
    if (backup)
      this.props.updateBackup(backup)
  }
  render(){
    const props = this.props
    const section = this.state.tab

    let Section=() => null
    switch(section){
      case "details":
        Section = Details
        break;
      case "edit":
        Section = Edit
        break;
    }

    return (
      <div className="ui expand with right side menu">

        <Section
          key={props.backup.id}
          gotoTab = {this.gotoTab.bind(this)}
          {...props}
          />

        <div className="ui side menu">
          <a className={`item ${section == "edit" ? "active" : ""}`}
             data-tooltip={i18n("Edit")}
             data-position="left center"
             onClick={() => this.setState({tab:"edit"})}
             >
            <i className="ui edit icon"></i>
          </a>
          <a className={`item ${section == "details" ? "active" : ""}`}
             data-tooltip={i18n("Details")}
             data-position="left center"
             onClick={() => this.setState({tab:"details"})}
             >
            <i className="ui file text outline icon"></i>
          </a>
          <a className={`item ${section == "logs" ? "active" : ""}`}
             data-tooltip={i18n("Logs")}
             data-position="left center"
             onClick={() => this.setState({tab:"logs"})}
             >
            <i className="icons">
              <i className="ui file text outline icon"></i>
              <i className="ui corner wait icon"/>
            </i>
            </a>
        </div>
      </div>
    )
  }
}

export default DetailsTab
