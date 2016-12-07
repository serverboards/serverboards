import React from 'react'
import Modal from 'app/components/modal'

const Details = React.createClass({
  render(){
    const props = this.props

    return (
      <Modal>
        <div className="ui top secondary menu header">
          <h3 className="ui header">Issue details</h3>
        </div>
        <div className="ui container">
        </div>
      </Modal>
    )
  }
})

export default Details
