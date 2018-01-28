const MarkdownPreview = Serverboards.Components.MarkdownPreview
const React = Serverboards.React

function MarkdownWrapper(props){
  return (
    <MarkdownPreview value={props.config.text} className="content"/>
  )
}

Serverboards.add_widget("serverboards.core.widgets/markdown", MarkdownWrapper, {react: true})
