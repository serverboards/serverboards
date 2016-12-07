import React from 'react'
import Modal from 'app/components/modal'

const Add = React.createClass({
  render(){
    const props = this.props

    return (
      <Modal>
        <div className="ui top secondary menu header">
          <h3 className="ui header">Add Issue</h3>
        </div>
        <div className="ui container">
          <div className="ui form">
            <div className="ui field">
              <label>Title</label>
              <input type="text" placeholder="Short issue description"/>
            </div>
            <div className="ui field">
              <label>Description</label>
              <textarea placeholder="Short issue description"></textarea>
            </div>
            <button className="ui button yellow">
            Add Issue
            </button>
          </div>
        </div>
      </Modal>
    )
  }
})

export default Add
