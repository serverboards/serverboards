let rpc = Serverboards.rpc
let Flash = Serverboards.Flash

function main(element, config){
  var term={}
  term.$el= $(element)
  term.$el.find('h2.ui.header').text(config.service.name)

  $('pre.terminal').text('')
  term.term = new Terminal()
  term.term.open(term.$el.find('pre.terminal')[0])

  term.interval_id=undefined
  term.send_timeout_id=undefined
  term.send_buffer=''
  term.ssh='undefined'
  term.host='undefined'

  function poll_data(){
    rpc.call(term.ssh+".recv",[term.host,'b64']).then(function(data){
      if (data){
        term.term.write(atob(data))
      }
    }).catch(function(e){
      clearInterval(term.interval_id)
      Flash.error("Closed connection // Error reading data\n\n"+e)
      term.interval_id=undefined
    })
  }
  function send_data(data){
    term.send_buffer+=data
    if (term.send_timeout_id)
      clearTimeout(term.send_timeout_id)
    term.send_timeout_id=setTimeout(function(){ // Coalesce 100 ms worth of user input
      rpc.call(term.ssh+".send", {uuid:term.host, data64: btoa(term.send_buffer)})
      term.send_buffer=''
    }, 100)
  }

  rpc.call("plugin.start", ["serverboards.core.ssh/daemon"]).then(function(ssh){
    term.ssh=ssh
    return rpc.call(ssh+".open", [config.service.config.url])
  }).then(function(host){
    term.host=host
    term.interval_id=setInterval(poll_data, 1000) // polling, very bad
    term.term.on('data', send_data)
  }).catch(function(e){
    Flash.error("Could not start SSH session\n\n"+e)
  })

  return function(){
    if (term.interval_id)
      clearInterval(term.interval_id)
  }
}

Serverboards.add_screen("serverboards.core.ssh/terminal", function(el,co){ setTimeout(function(){ main(el,co) }, 1000) })
