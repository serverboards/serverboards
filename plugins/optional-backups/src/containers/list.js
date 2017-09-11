const {React} = Serverboards
import BackupMenu from '../components/menu'
import View from '../components/list'

class List extends React.Component{
    componentDidMount(){
      this.props.setSectionMenu(BackupMenu, {onAddBackup: (data) => this.handleAddBackup(data)})
    }
    handleAddBackup(){
      console.log("Add backup")
    }
    render(){
      return (
        <View {...this.props}/>
      )
    }
}

export default List
