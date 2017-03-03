import React from 'react'
import Modal from 'app/components/modal'

const Add = React.createClass({
  handleAdd(){
    const title=this.refs.title.value
    const description=this.refs.description.value
    this.props.onAdd(title, description)
  },
  render(){
    const props = this.props

    return (
      <Modal>
        <div className="ui top secondary menu header">
          <h3 className="ui header">{i18n("Add Issue")}</h3>
        </div>
        <div className="ui container">
          <div className="ui form">
            <div className="ui field">
              <label>{i18n("Title")}</label>
              <input type="text" ref="title" placeholder={i18n("Short issue description")}/>
            </div>
            <div className="ui field">
              <label>{i18n("Description")}</label>
              <textarea ref="description" placeholder={i18n("Short issue description")}></textarea>
            </div>
            <button className="ui button yellow" onClick={this.handleAdd}>
            {i18n("Add Issue")}
            </button>
          </div>
        </div>
      </Modal>
    )
  }
})

export default Add
