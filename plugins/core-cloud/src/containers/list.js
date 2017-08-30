const {rpc, plugin, i18n, React} = Serverboards
const {Loading} = Serverboards.Components
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
      this.setState({items, loading: false})
    })
  }
  render(){
    if (this.state.loading)
      return (
        <Loading>{i18n("Cloud nodes")}</Loading>
      )
    return (
      <View
        items={this.state.items}
        reloadAll={this.componentDidMount.bind(this)}
        />
    )
  }
}

export default List
