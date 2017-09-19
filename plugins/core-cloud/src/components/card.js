const {React, i18n, cache, store, Components} = Serverboards
const colorize = Serverboards.utils.colorize
const {Loading, IconIcon} = Components

class CloudCard extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      template: undefined,
      parent: undefined,
    }
  }
  componentDidMount(){
    cache
      .service_type(this.props.item.type)
      .then( (template) => this.setState({template}) )
    cache
      .service( this.props.item.parent )
      .then( (parent) => this.setState({parent}))
  }
  render(){
    const {template, parent} = this.state
    if (!template || !parent){
      return (
        <div className="ui narrow card">
          <Loading>{i18n("Node information...")}</Loading>
        </div>
      )
    }
    const props = this.props
    const {item} = props
    return (
      <div className={`ui narrow card ${props.className || ""}`} onClick={props.onClick} style={{cursor:"pointer"}}>
        <div className="header">
          <IconIcon
            icon={template.icon}
            plugin={(template.type || "").split('/')[0]}
            className="ui mini"
            />
          <div className="right">
            <span className="ui text label">
              {item.state}&nbsp;
              <i className={`ui rectangular label ${colorize(item.state)}`}/>
            </span>
          </div>
        </div>
        <div className="content">
          <h3 className="ui header no bottom margin">{item.name}</h3>
          <div>
            {template.name}
          </div>
          <div>
            <a onClick={() => store.goto(`/services/${parent.uuid}/`)}>{parent.name}</a>
          </div>
        </div>
      </div>
    )
  }
}


export default CloudCard
