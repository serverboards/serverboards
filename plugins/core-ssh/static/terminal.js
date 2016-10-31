'strict mode'
var rpc = Serverboards.rpc
var Flash = Serverboards.Flash
var plugin = Serverboards.plugin
var plugin_id = "serverboards.core.ssh"

function main(element, config){
  var term={}
  term.$el= $(element)
  term.$el.find('#name').text(config.service.name)

  term.$el.find('pre.terminal').text('')
  term.term = undefined
  term.interval_id=undefined
  term.send_timeout_id=undefined
  term.send_buffer=''
  term.ssh='undefined'
  term.host='undefined'
  term.end=0

  function poll_data(){
    rpc.call(term.ssh+".recv",{uuid: term.host, start: term.end, encoding:'b64'}).then(function(data){
      term.end=data.end
      data=data.data
      if (data){
        term.term.write(atob(data))
      }
    }).catch(function(e){
      Flash.error("Closed connection // Error reading data\n\n"+e)
    })
  }
  function send_data(data){
    term.send_buffer+=data
    if (term.send_timeout_id)
      clearTimeout(term.send_timeout_id)
    term.send_timeout_id=setTimeout(function(){ // Coalesce 20 ms worth of user input
      rpc.call(term.ssh+".send", {uuid:term.host, data64: btoa(term.send_buffer)})
      term.send_buffer=''
    }, 20)
  }
  function setup_host(host){
    term.host=host
    term.term.on('data', send_data)

    // subscribe to new data at terminal
    var evname='terminal.data.received.'+host
    rpc.call("event.subscribe", [evname])
    rpc.on(evname, function(data){
      if (data.eof)
        return
      var newdata=atob(data.data64)
      term.term.write(newdata)
      if (data.end != (term.end + newdata.length)){
        console.warn("Data end do not match. Maybe some data lost.")
      }
      term.end=data.end
    })
  }

  Promise.all([
    plugin.load(plugin_id+"/xterm.js"),
    plugin.load(plugin_id+"/xterm.css"),
    plugin.load(plugin_id+"/terminal.css")
  ]).then( () =>
    plugin.load(plugin_id+"/fit.js")
  ).then( () => {
    term.term = new Terminal()
    term.term.open(term.$el.find('pre.terminal')[0])
    term.term.fit()
    return rpc.call("plugin.start", ["serverboards.core.ssh/daemon"])
  }).then(function(ssh){
    term.ssh=ssh
    return rpc.call(ssh+".list")
  }).then(function(list){
    //console.log(list)
    term.$el.on("keyup", function(ev){
      ev.preventDefault()
      ev.stopPropagation()
    })
    var new_term=true
    for (var i in list){
      if (list[i][1]==config.service.config.url){
        new_term=false
        host=list[i][0]
        setup_host(host)
        rpc.call(term.ssh+".recv", { uuid: host, encoding: "b64" }).then(function(data){
          term.term.write( atob( data.data ) )
        })
        break;
      }
    }
    if (new_term)
      rpc.call(term.ssh+".open", [config.service.config.url]).then(setup_host)
  }).catch(function(e){
    Flash.error("Could not start SSH session\n\n"+e)
  })

  return function(){
    if (term.host){
      var evname='terminal.data.received.'+term.host
      rpc.call("event.unsubscribe", [evname])
      rpc.off(evname)
    }
    if (term.term){
      term.term.destroy()
    }
    term.$el.html('')
  }
}

Serverboards.add_screen("serverboards.core.ssh/terminal", main)
