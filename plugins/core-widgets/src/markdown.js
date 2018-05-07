const {MarkdownPreview, Loading} = Serverboards.Components
const React = Serverboards.React

class MarkdownWrapper extends React.Component{
  constructor(props){
    super(props)
  }
  componentDidMount(){
    this.updateTitle()
  }
  updateTitle(){
    const text = this.props.config.text
    if (!text)
      return
    let title = text.split('\n')[0]
    if (title.startsWith("#"))
      title = title.slice(1)
    this.props.setTitle(title)
  }
  componentDidUpdate(prevProps, prevState, snapshot){
    if (this.props.config.text != prevProps.config.text)
      this.updateTitle()
  }
  render(){
    let text = this.props.config.text
    if (!text)
      return (
        <Loading.Widget/>
      )
    text = text.split('\n').slice(1)
    return (
      <div className="ui padding">
        <MarkdownPreview value={text.join('\n')} className="content"/>
      </div>
    )
  }
}

Serverboards.add_widget("serverboards.core.widgets/markdown", MarkdownWrapper, {react: true})
