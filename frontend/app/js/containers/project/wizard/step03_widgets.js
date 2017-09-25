import React from 'react'
import AddWidget from 'app/containers/project/board/add_widget'
import i18n from 'app/utils/i18n'

class AddWidgets extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      key: 1
    }
  }
  addAnotherWidget(){
    console.log("Add another widget")
    this.setState({key: this.state.key+1})
  }
  render(){
    return (
        <AddWidget
          key={this.state.key}
          onSkip={ () => this.props.nextStep() }
          onClose={ () => null }
          saveButtons={[
              {label: i18n("Add another widget"), className: "basic teal",onClick: (data) => this.addAnotherWidget()},
              {label: i18n("Save and continue"), className: "teal", onClick: () => this.props.nextStep()},
          ]}
          />
    )
  }
}

export function make_widgets(props){
  return (<AddWidgets {...props}/>)
}
