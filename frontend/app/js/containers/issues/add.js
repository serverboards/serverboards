import React from 'react'
import rpc from 'app/rpc'
import {goto} from 'app/utils/store'
import AddView from 'app/components/issues/add'
import {parse_comment, update_issue_multi} from './utils'

const Add = React.createClass({
  handleAdd(title, description){
    let updates = parse_comment(description)
    if (updates[0].type!="comment")
      return
    description=updates[0].data
    updates=updates.slice(1)

    let data = {title, description}

    let project=this.props.location.state.project
    if (project){
      data.aliases=[`project/${project}`]
    }

    rpc.call("issues.create", data)
      .then( (id) => {
        if (updates.length>0)
          return update_issue_multi(id, updates).then( () => id )
        return id
      }).then( (id) => goto(`/issues/${id}`) )
  },
  render(){
    return (
      <AddView {...this.props} onAdd={this.handleAdd}/>
    )
  }
})

export default Add;
