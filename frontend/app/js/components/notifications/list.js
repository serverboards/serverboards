import React from 'react'
import rpc from 'app/rpc'
import Loading from 'app/components/loading'
import store from 'app/utils/store'
import {push} from 'react-router-redux'
import {label_color} from './index'

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
    const list = this.state.list
    if (!list)
      return (
        <Loading>Notifications</Loading>
      )
    return(
      <div className="ui central white background">
        <div className="ui container">
          <h1 className="ui header">Notifications</h1>
          <table className="ui very basic selectable table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Date</th>
                <th>Tags</th>
                <th/>
              </tr>
            </thead>
            <tbody>
              {list.map( (n) => (
                <tr key={n.id} style={{cursor:"pointer"}} onClick={() => this.showNotification(n.id)} className={row_color(n)}>
                  <td>{n.subject}</td>
                  <td>{n.inserted_at.replace('T',' ')}</td>
                  <td>{n.tags.map( (t) => (
                    <span className={`ui tag tiny label ${label_color(t)}`}>{t}</span>
                  ))}</td>
                  <td className="right aligned"><a><i className="ui icon angle right"/></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
})

export default List
