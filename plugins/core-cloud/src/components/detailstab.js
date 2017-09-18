const {i18n, React} = Serverboards
import Details from '../containers/details'

class DetailsTab extends React.Component{
  constructor(props){
    super(props)

    this.state={
      tab: "details"
    }
  }
  render(){
    let Section = () => null
    const section = this.state.tab

    switch(section){
      case "details":
        Section=Details
        break;
    }

    return (
      <div className="ui expand with right side menu">
        <Section {...this.props}/>

        <div className="ui side menu">
          <a className={`item ${section == "details" ? "active" : ""}`}
             data-tooltip={i18n("Details")}
             data-position="left center"
             onClick={() => this.setState({tab:"details"})}
             >
            <i className="file text outline icon"></i>
          </a>
          <a className={`item ${section == "edit" ? "active" : ""}`}
             data-tooltip={i18n("Edit")}
             data-position="left center"
             onClick={() => this.setState({tab:"edit"})}
             >
            <i className="code icon"></i>
          </a>
          <a className={`item ${section == "logs" ? "active" : ""}`}
             data-tooltip={i18n("Logs")}
             data-position="left center"
             onClick={() => this.setState({tab:"logs"})}
             >
            <i className="desktop icon"></i>
            </a>
        </div>
      </div>
    )
  }
}

export default DetailsTab
