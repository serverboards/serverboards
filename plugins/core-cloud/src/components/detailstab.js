const {i18n, React} = Serverboards
import Details from './details'
import SSH from './ssh'

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
      case "ssh":
        Section=SSH
        break;
    }

    const has_ssh = Boolean((this.props.vmc.props.private_ips || this.props.vmc.props.public_ips || []).length>0)
    const has_spice = Boolean(this.props.vmc.props.spice_url)

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
          {has_ssh && (
            <a className={`item ${section == "ssh" ? "active" : ""}`}
               data-tooltip={i18n("SSH Remote Terminal")}
               data-position="left center"
               onClick={() => this.setState({tab:"ssh"})}
               >
              <i className="code icon"></i>
            </a>
          )}
          {has_spice && (
            <a className={`item ${section == "remote_desktop" ? "active" : ""}`}
               data-tooltip={i18n("Remote Desktop")}
               data-position="left center"
               onClick={() => this.setState({tab:"remote_desktop"})}
               >
              <i className="desktop icon"></i>
            </a>
          )}
        </div>
      </div>
    )
  }
}

export default DetailsTab
