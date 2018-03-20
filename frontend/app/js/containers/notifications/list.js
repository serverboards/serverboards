import React from 'react'
import rpc from 'app/rpc'
import store from 'app/utils/store'
import ListView from 'app/components/notifications/list'

class List extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      list: undefined,
      startn: 0,
      loading: true,
    }
  }
  componentDidMount(){
    this.update(null)
  }
  update(startn){
    console.log("update %o", startn)
    this.setState({loading: true, startn})
    let filter={ count: 50 }
    if (startn)
      filter["start"]=startn
    rpc.call("notifications.list", filter).then((list) =>{
      this.setState({list, loading: false})
      list.map((n) => {
        if (n.tags.indexOf("new")>=0){
          const tags = n.tags.filter( (t) => (t!="new") )
          rpc.call("notifications.update", {id: n.id, tags})
        }
      })
    })
  }
  showNotification(id){
    store.goto(`/notifications/${id}`)
  }
  handleShowNextPage(){
    const last_id=this.state.list[this.state.list.length-1].id
    this.update(last_id)
  }
  handleShowFirstPage(){
    this.update(null)
  }
  render(){
    return (
      <ListView {...this.state} {...this.props}
        showNotification={this.showNotification.bind(this)}
        handleShowNextPage={this.handleShowNextPage.bind(this)}
        handleShowFirstPage={this.handleShowFirstPage.bind(this)}
        />
    )
  }
}

export default List
