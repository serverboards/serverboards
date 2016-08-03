let rpc = Serverboards.rpc
let Flash = Serverboards.Flash

function main(element, config){
  var $el = $(element)
  console.log(config)
  $el.find('h2.ui.header').text(config.service.name)
  var term = new Terminal()
  $('pre.terminal').text('')
  term.open($('pre.terminal')[0])
  var interval_id
  var send_timeout_id
  var send_buffer=''

  rpc.call("plugin.start", ["serverboards.core.ssh/daemon"]).then(function(ssh){
    rpc.call(ssh+".open", [config.service.config.url]).then(function(host){
      interval_id=setInterval(function(){
        rpc.call(ssh+".recv",[host]).then(function(data){
          term.write(atob(data))
        }).catch(function(e){
          clearInterval(interval_id)
          Flash.error("Closed connection // Error reading data\n\n"+e)
          interval_id=undefined
        })
      }, 1000) // polling, very bad
      term.on('data', function(data){
        send_buffer+=data
        if (send_timeout_id)
          clearTimeout(send_timeout_id)
        send_timeout_id=setTimeout(function(){ // Coalesce 100 ms worth of user input
          rpc.call(ssh+".send", [host, send_buffer])
          send_buffer=''
        },100)
      })
    })
  }).catch(function(e){
    Flash.error("Could not start terminal")
  })

  return function(){
    if (interval_id)
      clearInterval(interval_id)
  }
}

Serverboards.add_screen("serverboards.core.ssh/terminal", function(el,co){ setTimeout(function(){ main(el,co) }, 1000) })
