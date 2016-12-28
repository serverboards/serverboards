import React from 'react'
import DetailsView from 'app/components/issues/details'
import rpc from 'app/rpc'
import Flash from 'app/flash'

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
    return rpc.call("issues.update", [Number(this.props.params.id), {type: "comment", data: comment}])
      .then( () => this.componentDidMount() )
  },
  handleAddCommentAndClose(comment){
    return rpc.call("issues.update", [Number(this.props.params.id), {type: "change_status", data: "closed"}])
      .then( () =>  this.addComment(comment))
      .then( () => {
        Flash.info("Added new comment and reopened issue")
        this.setState({issue: merge(this.state.issue, {status: "closed"})})
      })
  },
  handleAddCommentAndReopen(comment){
    return rpc.call("issues.update", [Number(this.props.params.id), {type: "change_status", data: "open"}])
      .then( () =>  this.addComment(comment))
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
