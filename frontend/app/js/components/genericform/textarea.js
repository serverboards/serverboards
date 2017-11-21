import React from 'react'
import RichDescription from './richdescription'
import i18n from 'app/utils/i18n'
import plugin from 'app/utils/plugin'

const SEPARATORS=/ \:\n.\[\]\s/

function is_space(c){
  return (c ==" " || c==":" || c == "\n")
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

function cursor_top(ta){
  if (!ta)
    return 0
  const text = ta.value
  const end = ta.selectionStart
  let line=1
  for(let i=0; i<end; i++){
    if (text[i]=='\n')
      line+=1
  }
  return line*18
}

function cursor_left(ta){
  if (!ta)
    return 0
    const text = ta.value
    const end = ta.selectionStart
    let col=1
    for(let i=0; i<end; i++){
      if (text[i]=='\n')
        col=0
      col+=1
    }
    return col*8.5+8
}

class TextArea extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      autocomplete: undefined,
      autocomplete_current: undefined
    }
  }
  componentDidMount(){
    if (this.props.autocomplete)
      this.updateAutocomplete()
  }
  updateAutocomplete(){
    const ac = this.props.autocomplete

    const newtext=prefix_at_cursor(this.refs.textarea).toLocaleLowerCase()
    // console.log("Handle change to %o", newtext)

    plugin.start_call_stop( ac.command, ac.call, {"current": newtext, ...this.form_data}).then(
      autocomplete => {
        console.log(autocomplete)
        this.setState({autocomplete})
      })
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
      this.updateAutocomplete()
    }, 300)

    this.setState({autocompletedelay})
    this.props.onChange(ev)
  }
  is_autocomplete_open(){
    return !!(this.state.autocomplete && this.state.autocomplete.length>0)
  }
  handleKeyboard(ev){
    if (!this.is_autocomplete_open())
      return
    let ignorekey=false
    let autocomplete_current = this.state.autocomplete_current || 0
    // console.log(ev.key)

    if (ev.key == "ArrowUp"){
      autocomplete_current = autocomplete_current - 1
      ignorekey=true
    }
    if (ev.key == "ArrowDown"){
      autocomplete_current = autocomplete_current + 1
      ignorekey=true
    }
    if (ev.key == "PageUp"){
      autocomplete_current = autocomplete_current - 3
      ignorekey=true
    }
    if (ev.key == "PageDown"){
      autocomplete_current = autocomplete_current + 3
      ignorekey=true
    }

    if (autocomplete_current != this.state.autocomplete_current){
      if (autocomplete_current>=this.state.autocomplete.length)
        autocomplete_current=0
      if (autocomplete_current<0)
        autocomplete_current=this.state.autocomplete.length-1
      this.setState({autocomplete_current})
      if (this.refs.popup)
        this.refs.popup.scrollTop=autocomplete_current*30
    }

    if (ev.key == "Enter"){
      if (this.state.autocomplete[this.state.autocomplete_current]){
        this.insertAtCursor(this.state.autocomplete[this.state.autocomplete_current])
      }
    }
    if (ev.key == "ArrowLeft"){
      this.setState({cursor: this.refs.textarea.selectionStart})
    }
    if (ev.key == "ArrowRight"){
      this.setState({cursor: this.refs.textarea.selectionStart})
    }
    if (ev.key == "Escape"){
      this.setState({autocomplete:[]})
      ignorekey=true
    }

    if (ignorekey){
      ev.stopPropagation()
      ev.preventDefault()
      // console.log("Must ignore key", ev, this.state.autocomplete)
    }
  }
  render(){
    const {state, props} = this
    return (
      <div className={`field ${props.className || ""}`}>
        <label>{i18n(props.label)}</label>
        <RichDescription className="ui meta" value={i18n(props.description)} vars={props.vars}/>
        <div style={{position: "relative"}}>
          <textarea
            ref="textarea"
            className={this.props.autocomplete && "ui fixed text"}
            name={props.name}
            placeholder={i18n(props.placeholder || props.description)}
            defaultValue={props.value}
            onChange={this.handleChange.bind(this)}
            onKeyDown={this.handleKeyboard.bind(this)}
            onClick={() => this.setState({autocomplete:[]})}
            />
          {this.is_autocomplete_open() && (
              <div className="ui mini dropdown menu with scroll" ref="popup" style={{maxHeight: "10em", position: "absolute", top: cursor_top(this.refs.textarea), left: cursor_left(this.refs.textarea) }}>
                {state.autocomplete.map( (i,n) => (
                  <div key={i} className={`item ${ n == state.autocomplete_current ? "selected" : ""} `} onClick={() => this.insertAtCursor(i)}>
                    {i}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    )
  }
}

export default TextArea
