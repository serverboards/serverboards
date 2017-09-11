const {store, React} = Serverboards
const {Error} = Serverboards.Components

import BackupMenu from '../components/menu'
import View from '../components/list'
import Add from '../containers/add'

const BACKUPS = [
  {
    id: 1,
    name: "Coronis content",
    description: "QNAP SSH",
    completed_date: "2017-10-09 19:02",
    size: 70000,
    enabled: true,
    status: "ok",
    source: {
      component: "serverboards.optional.backup/backup.ssh.source",
      config: {path: "/var/coronis/", service:"b3fc12ee-cecd-4cf0-b10f-760630478fd7"}
    },
    destination: {
      component: "serverboards.optional.backup/backup.ssh.destination",
      config: {path: "/var/backup/coronis-{date_}.tgz", service:"b3fc12ee-cecd-4cf0-b10f-760630478fd7"}
    },
    schedule: {
      days: [3,5,6],
      time: "23:00"
    }
  },
  {
    id: 2,
    name: "Coronis content",
    description: "QNAP SSH",
    completed_date: "2017-10-09 19:02",
    size: 1234*1024*1024,
    enabled: false,
    status: "error",
    source: {
      component: "serverboards.optional.backup/backup.ssh.source",
      config: {path: "/etc/", service:"b3fc12ee-cecd-4cf0-b10f-760630478fd7"}
    },
    destination: {
      component: "serverboards.optional.backup/backup.ssh.destination",
      config: {path: "/var/backup/etc-{date_}.tgz", service:"b3fc12ee-cecd-4cf0-b10f-760630478fd7"}
    },
    schedule: {
      days: [3,5,6],
      time: "23:00"
    }
  },
]


class List extends React.Component{
    constructor(props){
      super(props)
      this.state={
        current: undefined
      }
    }
    componentDidMount(){
      this.props.setSectionMenu(BackupMenu)
    }
    render(){
      const mode = store.getState().routing.locationBeforeTransitions.pathname.endsWith("/add")  ? "add" : "list"

      switch(mode){
        case "list":
          return (
            <View
              {...this.props}
              backups={BACKUPS}
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
