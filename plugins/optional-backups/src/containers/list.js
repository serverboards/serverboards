const {store, i18n, rpc, utils, React} = Serverboards
const {Error, Loading} = Serverboards.Components

import BackupMenu from '../components/menu'
import View from '../components/list'
import Add from '../containers/add'

class List extends React.Component{
    constructor(props){
      super(props)
      this.state={
        current: undefined,
        backups: undefined
      }
    }
    componentDidMount(){
      this.props.setSectionMenu(BackupMenu)
      rpc
        .call("plugin.data.items", ["serverboards.optional.backups", `${this.props.project}-`])
        .then( backups =>
            this.setState({
                backups: backups.map( idb => {
                  let id = idb[0]
                  const b = idb[1]
                  return utils.merge(b, { id })
                }  )
            } ) )
    }
    render(){
      const mode = store.getState().routing.locationBeforeTransitions.pathname.endsWith("/add")  ? "add" : "list"

      switch(mode){
        case "list":
          if (this.state.backups==undefined){
            return (<Loading>{i18n("Backups")}</Loading>)
          }
          return (
            <View
              {...this.props}
              backups={this.state.backups}
              current={this.state.current}
              setCurrent={(current) => this.setState({current})}
              />
          )
        case "add":
          return (
            <Add {...this.props}/>
          )
        default:
          return (
            <Error>{i18n("Unknown view")}</Error>
          )
      }
    }
}

export default List
