import React from 'react'

const Filters=React.createClass({
  componentDidMount(){
    $(this.refs.add_labels).hide()
    $(this.refs.add_labels_input).on("change", () => {
      this.props.onAddLabel(this.refs.add_labels_input.value.split(" "))
      this.refs.add_labels_input.value=""
      $(this.refs.add_labels).slideUp()
    })
  },
  handleOpenEditFilters(){
    $(this.refs.add_labels).slideDown(() => {
      $(this.refs.add_labels_input).focus()
    })
  },
  render(){
    const {issue} = this.props
    return (
      <div>
        <div style={{position: "relative"}}>
          <a style={{position: "absolute", top:9, right:0, cursor: "pointer"}} onClick={this.handleOpenEditFilters}><i className="ui add yellow icon"/></a>
          <h4 className="ui header">Labels</h4>
          <div className="ui form" style={{margin: 20}} ref="add_labels">
            <input type="text" ref="add_labels_input" placeholder="Press ENTER when finished"/>
          </div>
          {(issue.labels || []).map( (l) => (
            <div key={l.name} style={{paddingBottom: 10}}>
              <span className={`ui tag label ${l.color}`}>{l.name} <a onClick={() => this.props.onRemoveLabel(l.name)}><i className="ui icon close"/></a></span>
            </div>
          ))}
        </div>
        {/*
        <div>
          <h4 className="ui header">Asignees</h4>
          <a><i className="ui add yellow"/></a>
        </div>
        <div>
          <h4 className="ui header">Participants</h4>
        </div>
        <div>
          <h4 className="ui header">Files</h4>
        </div>
        */}
      </div>
    )
  }
})

export default Filters
