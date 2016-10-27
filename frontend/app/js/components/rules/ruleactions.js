import React from 'react'
import ActionEdit from './actionedit'
import rpc from 'app/rpc'

const PresetActions=React.createClass({
  getInitialState(){
    return {presets: [ ]}
  },
  componentDidMount(){
    let self=this
    rpc.call("plugin.list_components", {type:"action template"})
      .then( (presets) => {
        presets = presets.filter( (p) => {
          if ('any' in p.extra.actions)
            return true
          for(let st of self.props.actions){
            if (!(st.state in p.extra.actions))
              return false
          }
          return true
        })

        this.setState({presets})
      })
      $(this.refs.dropdown).dropdown({
        onChange(){
          const val=this.value
          const preset = self.state.presets.find( (p) => p.id == val ).extra.actions
          for (let ac of self.props.actions){
            let preset_action=preset[ac.state]
            if (!preset_action)
              preset_action=preset["any"]
            if (!preset_action)
              preset_action={action: "", params: {}}

            self.props.handleActionConfig(ac.state, preset_action.action, preset_action.params)
          }
        }
      })
  },
  render(){
    return (
      <div className="ui field">
        <select ref="dropdown" className="ui dropdown search">
          <option value="">Select a preset</option>
          {this.state.presets.map( (p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
    )
  }
})

const RuleActions=React.createClass({
  getInitialState(){
    return {
      show_custom: true,
    }
  },
  componentDidMount(){
    let self=this
    $(this.refs.checkboxes).find('.checkbox').checkbox({
      onChange: function(){
        const val=this.value
        self.setState({show_custom: (val == "custom")})
      }
    })
  },
  render(){
    const {actions, action_catalog, handleActionConfig, defconfig} = this.props
    return (
      <div>
        <h2 className="ui header uppercase" style={{paddingTop:20}}>Action</h2>
        <div ref="checkboxes" className="ui form">
          <div className="inline fields">
            <div className="field">
              <div className="ui radio checkbox">
                <input type="radio" name="custom_or_preset" value="custom" defaultChecked="on" className="hidden"/>
                <label>Custom actions</label>
              </div>
            </div>
            <div className="field">
              <div className="ui radio checkbox">
                <input type="radio" name="custom_or_preset" value="preset" className="hidden"/>
                <label>Preset actions</label>
              </div>
            </div>
          </div>
        </div>

        {this.state.show_custom ? (
          <CustomActions {...this.props}/>
        ) : (
          <PresetActions {...this.props}/>
        )}
      </div>
    )
  }
})

function CustomActions({actions, action_catalog, handleActionConfig, defconfig}){
  return (
    <div>
      {actions.map( (action) => (
        <div key={action.state} >
          <h3 className="ui header uppercase"><span className="ui meta">IF</span> {action.state} <span className="ui meta">THEN</span></h3>
          <ActionEdit action={action} catalog={action_catalog} onUpdateAction={handleActionConfig} noparams={defconfig}/>
        </div>
      ))}
    </div>
  )
}

export default RuleActions
