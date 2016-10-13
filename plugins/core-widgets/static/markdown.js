function main(element, config){
  var MarkdownPreview = Serverboards.Components.MarkdownPreview

  Serverboards.ReactDOM.render(
    Serverboards.React.createElement(MarkdownPreview, {value: config.text, className: "content"},[]),
    element
  )

  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(element)
  }
}
Serverboards.add_widget("serverboards.core.widgets/markdown", main)
