import React from 'react'
import Modal from 'app/components/modal'
import i18n from 'app/utils/i18n'

class Add extends React.Component{
  handleAdd(){
    const title=this.refs.title.value
    const description=this.refs.description.value
    this.props.onAdd(title, description)
  }
  render(){
    const props = this.props

    return (
      <div className="ui expand">
        <div className="ui top secondary menu header">
          <h3 className="ui header">{i18n("Add Issue")}</h3>
        </div>
        <div className="ui text container">
          <div className="ui form">
            <div className="ui field">
              <label>{i18n("Title")}</label>
              <input type="text" ref="title" placeholder={i18n("Short issue description")}/>
            </div>
            <div className="ui field">
              <label>{i18n("Description")}</label>
              <textarea ref="description" placeholder={i18n("Short issue description")}></textarea>
            </div>
            <button className="ui button yellow" onClick={this.handleAdd.bind(this)}>
            {i18n("Add Issue")}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default Add
