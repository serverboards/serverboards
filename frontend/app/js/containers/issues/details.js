import React from 'react'
import DetailsView from 'app/components/issues/details'
import rpc from 'app/rpc'
import Flash from 'app/flash'
import {parse_comment, update_issue_multi, update_issue} from './utils'
import {merge} from 'app/utils'
import Loading from 'app/components/loading'
import {i18n} from 'app/utils/i18n'

class Details extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      issue: undefined,
      issue_id: this.props.issue_id || this.props.params.id
    }
    this.handlers = {
      onAddComment: this.handleAddComment.bind(this),
      onAddCommentAndClose: this.handleAddCommentAndClose.bind(this),
      onAddCommentAndReopen: this.handleAddCommentAndReopen.bind(this),
      onOpenIssue: this.handleOpenIssue.bind(this),
      onCloseIssue: this.handleCloseIssue.bind(this),
      onRemoveLabel: this.handleRemoveLabel.bind(this),
      onAddLabel: this.handleAddLabel.bind(this),
    }
  }
  componentDidMount(){
    rpc.call("issues.get", [this.state.issue_id]).then( (issue) => {
      this.setState({issue})
    })
  }
  handleAddComment(comment){
    return update_issue_multi(this.state.issue_id, parse_comment(comment))
      .then( () => this.componentDidMount() )
  }
  handleAddCommentAndClose(comment){
    return update_issue_multi(this.state.issue_id, parse_comment(comment).concat( {type: "change_status", data: "closed"} ))
      .then( () => {
        Flash.info("Added new comment and reopened issue")
        this.setState({issue: merge(this.state.issue, {status: "closed"})})
        this.componentDidMount()
      })
  }
  handleAddCommentAndReopen(comment){
    return update_issue_multi(this.state.issue_id, parse_comment(comment).concat( {type: "change_status", data: "open"} ))
      .then( () => {
        Flash.info("Added new comment and reopened issue")
        this.setState({issue: merge(this.state.issue, {status: "open"})})
        this.componentDidMount()
      })
  }
  handleOpenIssue(){
    return update_issue_multi(this.state.issue_id, [ {type: "change_status", data: "open"} ] )
      .then( () => {
        Flash.info("Reopened issue")
        this.setState({issue: merge(this.state.issue, {status: "open"})})
        this.componentDidMount()
      })
  }
  handleCloseIssue(){
    return update_issue_multi(this.state.issue_id, [ {type: "change_status", data: "closed"} ] )
      .then( () => {
        Flash.info("Closed issue")
        this.setState({issue: merge(this.state.issue, {status: "closed"})})
        this.componentDidMount()
      })
  }
  handleAddLabel(tags){
    return update_issue(this.state.issue_id, {type:"set_labels", data:tags})
      .then( () => this.componentDidMount() )
  }
  handleRemoveLabel(tag){
    return update_issue(this.state.issue_id, {type:"unset_labels", data:[tag]})
      .then( () => this.componentDidMount() )
  }
  render(){
    if (!this.state.issue)
      return (
        <Loading>{i18n("Issue data")}</Loading>
      )
    return (
      <DetailsView {...this.props} {...this.state} {...this.handlers}/>
    )
  }
}

export default Details
