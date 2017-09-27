import React from 'react'

function WizardView(props){
  const {step} = props
  return (
    <div className="ui expand grey background">
      <div className="ui right aligned">
        <span className="ui horizontal center aligned with padding top">
          <span className="ui right padding">Steps:</span>
          <span className={`ui micro label circular ${step==1 ? "blue" : ""}`}/>
          <span className={`ui micro label circular ${step==2 ? "blue" : ""}`}/>
          <span className={`ui micro label circular ${step==3 ? "blue" : ""}`}/>
          <span className={`ui micro label circular ${step==4 ? "blue" : ""}`}/>
          <span className="ui right padding"/>
        </span>
      </div>
      {props.children}
    </div>
  )
}

export default WizardView
