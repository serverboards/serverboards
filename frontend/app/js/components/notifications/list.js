import React from 'react'
import rpc from 'app/rpc'
import Loading from 'app/components/loading'
import store from 'app/utils/store'
import {push} from 'react-router-redux'
import {label_color} from './index'
import NotificationItem from './item'
import {months} from 'app/utils'

require('sass/table.sass')

function row_color(n){
  if(n.tags.indexOf('new')>=0)
    return 'positive'
  if(n.tags.indexOf('unread')>=0)
    return ''
  return 'light grey'
}

const List = React.createClass({
  getInitialState(){
    return {
      list: undefined
    }
  },
  componentDidMount(){
    const filter={}
    rpc.call("notifications.list", filter).then((list) =>{
      this.setState({list})
      list.map((n) => {
        if (n.tags.indexOf("new")>=0){
          const tags = n.tags.filter( (t) => (t!="new") )
          rpc.call("notifications.update", {id: n.id, tags})
        }
      })
    })
  },
  showNotification(id){
    store.dispatch( push(`/notifications/${id}`) )
  },
  render(){
    let month=undefined
    let year=(new Date()).getFullYear()
    let lastyear=year
    function maybe_month(d){
      const dd=new Date(d)
      const dmonth=dd.getMonth()
      const dyear=dd.getFullYear()
      if (month==dmonth && dyear==lastyear)
        return []
      month=dmonth
      let txt=months[month]

      if (dyear!=year){
        txt=txt+' '+dyear
      }

      return (
        <div className="ui rail left"><span className="ui tiny header">{txt}</span></div>
      )
    }

    const list = this.state.list
    if (!list)
      return (
        <Loading>Notifications</Loading>
      )
    return(
      <div className="ui central white background">
        <div className="ui text container">
          <h1 className="ui header">All Notifications</h1>
          <div className="ui relaxed divided list" id="message_list">
            {list.map( (n) => (
              <div className="item">
                {maybe_month(n['inserted_at'])}
                <NotificationItem notification={n}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }
})

export default List
