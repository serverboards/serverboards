import React from 'react'
import RichDescription from './richdescription'
import i18n from 'app/utils/i18n'
import plugin from 'app/utils/plugin'

const SEPARATORS=/ \:\n.\[\]\s/

function is_space(c){
  return (c ==" " || c==":" || c=="[" || c == "]" || c == "\n")
}

function prefix_at_cursor(textarea){
  const text = textarea.value
  const end = textarea.selectionStart
  let start
  for (start=end-1; start>0; start--){
    const c = text[start]
    if (is_space(c)){
      start += 1
      break
    }
  }
  return text.slice(start, end)
}

function replace_around_cursor(textarea, value){
  const text = textarea.value
  let end = textarea.selectionStart-1
  let start
  for (start=end; start>0; start--){
    const c = text[start]
    if (is_space(c)){
      start += 1
      break
    }
  }
  for(;end<text.length;end++){
    const c = text[end]
    if (is_space(c)){
      break
    }
  }
  const ntext = text.slice(0, start)+value+text.slice(end)
  textarea.value=ntext
  textarea.selectionStart = start+value.length
}

class TextArea extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      autocomplete: undefined
    }
  }
  componentDidMount(){
    if (this.props.autocomplete)
      this.updateAutocomplete()
  }
  updateAutocomplete(){
    const ac = this.props.autocomplete
    plugin.start_call_stop( ac.command, ac.call, {"current": this.refs.textarea.value, ...this.form_data}).then(
      autocomplete => this.setState({autocomplete, autocomplete_all: autocomplete})
    )
  }
  insertAtCursor(value){
    replace_around_cursor(this.refs.textarea, value)
    this.refs.textarea.focus()

    this.handleChange({target:{value:this.refs.textarea.value}})
  }
  handleChange(ev){
    if (this.state.autocompletedelay)
      clearTimeout(this.state.autocompletedelay)
    const autocompletedelay = setTimeout(() => {
      const newtext=prefix_at_cursor(this.refs.textarea).toLocaleLowerCase()
      console.log("Handle change to %o", newtext)

      const autocomplete = this.state.autocomplete_all.filter( ac => ac.toLocaleLowerCase().includes(newtext) )
      this.setState({autocomplete, autocompletedelay: undefined})
    }, 300)

    this.setState({autocompletedelay})
    this.props.onChange(ev)
  }
  render(){
    const {state, props} = this
    return (
      <div className={`field ${props.className || ""}`} style={{position: "relative"}}>
        <label>{i18n(props.label)}</label>
        <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars}/>
        <textarea
          ref="textarea"
          name={props.name}
          placeholder={i18n(props.placeholder || props.description)}
          defaultValue={props.value}
          onChange={this.handleChange.bind(this)}/>
            {state.autocomplete && (
                <div className="ui dropdown menu with scroll" style={{maxHeight: "10em"}}>
                  {state.autocomplete.map( i => (
                    <div key={i} className="item" onClick={() => this.insertAtCursor(i)}>
                      {i}
                    </div>
                  ))}
              </div>
            )}
      </div>
    )
  }
}

export default TextArea
