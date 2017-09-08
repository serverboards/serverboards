const {rpc, plugin, i18n, utils, React} = Serverboards
const {Loading, Error} = Serverboards.Components
import View from '../components/list'

class List extends React.Component{
  constructor(props){
    super(props)
    this.state={
      loading: true,
      items: undefined
    }
  }
  componentDidMount(){
    plugin.start_call_stop("serverboards.core.cloud/daemon", "list", {project: this.props.project}).then( (items) => {
      this.setState({items: utils.sort_by_name(items), loading: false})
    }).catch( e => this.setState({loading: "error"}))
  }
  render(){
    if (this.state.loading == true){
      return (
        <Loading>{i18n("Cloud nodes")}</Loading>
      )
    }
    if (this.state.loading == "error"){
      return (
        <Error>{i18n("Could not load cloud nodes list. Try again.")}</Error>
      )
    }
    return (
      <View
        items={this.state.items}
        reloadAll={this.componentDidMount.bind(this)}
        />
    )
  }
}

export default List
