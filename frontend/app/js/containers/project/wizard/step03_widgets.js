import React from 'react'
import AddWidget from 'app/containers/board/add_widget'
import i18n from 'app/utils/i18n'
import Flash from 'app/flash'
import rpc from 'app/rpc'

class AddWidgets extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      key: 1
    }
  }
  addAnotherWidget(widget){
    this.saveWidget(widget)
    console.log("Add another widget")
    this.setState({key: this.state.key+1})
  }
  saveAndContinue(widget){
    this.saveWidget(widget)
    this.props.nextStep()
  }
  saveWidget(widget){
      rpc.call("dashboard.widget.create", widget)
        .catch(Flash.error)
  }
  render(){
    return (
        <AddWidget
          key={this.state.key}
          onSkip={ () => this.props.nextStep() }
          onClose={false}
          saveButtons={[
              {label: i18n("Add another widget"), className: "basic teal",onClick: (data) => this.addAnotherWidget(data)},
              {label: i18n("Save and continue"), className: "teal", onClick: (data) => this.saveAndContinue(data)},
          ]}
          />
    )
  }
}

export function make_widgets(props){
  return (<AddWidgets {...props}/>)
}
