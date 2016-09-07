let React = Serverboards.React
let ReactDOM = Serverboards.ReactDOM

import Console from './console'

function main([el], settings){
  let MyConsole = function(props){
    return (
      <Console service={settings.service}/>
    )
  }

  Serverboards.ReactDOM.render(React.createElement(MyConsole, null), el)

  return function(){
    Serverboards.ReactDOM.unmountComponentAtNode(el)
  }
}

Serverboards.add_screen("serverboards.remotesql/console", function(el,co){ setTimeout(function(){ main(el,co) }, 1000) })
