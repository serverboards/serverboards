import React from 'react'
import AddService from 'app/containers/service/add'
import i18n from 'app/utils/i18n'

class AddServices extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      key: 1
    }
  }
  addAnotherService(){
    console.log("Add another widget")
    this.setState({key: this.state.key+1})
  }
  render(){
    const props = this.props
    return (
        <AddService
          key={this.state.key}
          onSkip={ () => props.nextStep() }
          prevStep={props.prevStep}
          onClose={false}
          saveButtons={[
              {label: i18n("Add another service"), className: "basic teal",onClick: (data) => this.addAnotherService()},
              {label: i18n("Save and continue"), className: "teal", onClick: () => this.props.nextStep()},
          ]}
          />
    )
  }
}

export function make_services(props){
  return (<AddServices {...props}/>)
}
