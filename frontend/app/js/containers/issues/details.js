import React from 'react'
import DetailsView from 'app/components/issues/details'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import {parse_comment, update_issue_multi} from './utils'
import {merge} from 'app/utils'

const Details = React.createClass({
  getInitialState(){
    return {issue: undefined}
  },
  componentDidMount(){
    console.log(this.props)
    rpc.call("issues.get", [this.props.params.id]).then( (issue) => {
      this.setState({issue})
    })
  },
  addComment(comment){
    return update_issue_multi(this.props.params.id, parse_comment(comment))
      .then( () => this.componentDidMount() )
  },
  handleAddCommentAndClose(comment){
    return update_issue_multi(this.props.params.id, parse_comment(comment).concat( {type: "change_status", data: "closed"} ))
      .then( () => {
        Flash.info("Added new comment and reopened issue")
        this.setState({issue: merge(this.state.issue, {status: "closed"})})
      })
  },
  handleAddCommentAndReopen(comment){
    return update_issue_multi(this.props.params.id, parse_comment(comment).concat( {type: "change_status", data: "open"} ))
      .then( () => {
        Flash.info("Added new comment and reopened issue")
        this.setState({issue: merge(this.state.issue, {status: "open"})})
      })
  },
  render(){
    const fs={
      addComment: this.addComment,
      handleAddComment: this.handleAddComment,
      handleAddCommentAndClose: this.handleAddCommentAndClose,
      handleAddCommentAndReopen: this.handleAddCommentAndReopen,
      handleFocusComment: this.handleFocusComment
    }
    return (
      <DetailsView {...this.props} {...this.state} {...fs}/>
    )
  }
})

export default Details
