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
  term.ssh=undefined
  term.host=undefined
  term.end=0
  term.tabs=[]

  window.term=term

  function add_tab(name, host){
    term.tabs.push({
      name: name,
      host: host
    })
    update_tabs()
  }
  function add_new_tab(){
    console.log("Add new tab")
    rpc.call(term.ssh+".open", [config.service.config.url]).then(function(host){
      console.log("Added %o", host)
      add_tab(
        config.service.config.url + " " + term.tabs.length,
        host
      )
      open_host(host)
    })
  }
  function update_tabs(){
    var tabs=[]
    term.tabs.map(function(t){
      //var a_clone=$('<div>',{"class":"item link"}).append('<i class="ui icon clone"/>')
      var a_close=$('<div>',{"class":"item link"}).append('<i class="ui icon close"/>')
      var links=$('<div>',{"class": "right options"})
        .append(a_close)
      //  .append(a_clone)
      var tab=$('<div>',{"class": "item link"})
        .append(t.name)
        .append(links)
      if (term.host==t.host)
        tab.addClass("active")
      a_close.on("click", function(){ close_host(t.host) })

      tab.on("click", function(){ open_host(t.host) })
      tabs.push(tab)
    })
    var add=$('<div class="item"><i class="ui icon add"></div>')
    add.on("click", add_new_tab)
    tabs.push(add)

    term.$el.find('#tabs')
      .html(tabs)
      .on('mousewheel', function(ev){
        var delta=ev.originalEvent.wheelDelta/50
        var scrollLeft=$(this).scrollLeft()
        $(this).scrollLeft(scrollLeft-Math.round(delta))
      })
  }

  function open_host(host){
    unsetup_host(term.host)
    setup_host(host)
    update_tabs()
  }

  function close_host(host){
    term.tabs=term.tabs.filter( function(t){
      return (t.host != host)
    })
    if (host==term.host)
      unsetup_host(term.host)
    if (term.tabs.length>0){
      open_host(term.tabs[0].host)
    }
    else{
      add_new_tab()
    }
    rpc.call(term.ssh+".close", [host]).then(function(){
      console.log("Closed tab")
    }).catch(function(e){
      console.error(e)
    })
  }

  function poll_data(){
    if (!term.host){
      console.error("No host defined")
      return
    }
    rpc.call(term.ssh+".recv",{uuid: term.host, start: term.end, encoding:'b64'}).then(function(data){
      //console.log("Got data %o", atob(data.data))
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
    //console.log("Send data %o", data)
    term.send_buffer+=data
    if (term.send_timeout_id)
      clearTimeout(term.send_timeout_id)
    term.send_timeout_id=setTimeout(function(){ // Coalesce 20 ms worth of user input
      rpc.call(term.ssh+".send", {uuid:term.host, data64: btoa(term.send_buffer)})
      term.send_buffer=''
    }, 20)
  }
  function send_resize(data){
    console.log("Resize terminal to %ox%o", data.cols, data.rows)
    rpc.call(term.ssh+".send_control", {
      uuid: term.host,
      type: "resize",
      data: {
        cols: data.cols,
        rows: data.rows
      }
    })
  }
  function viewport_resize(){
    term.term.fit()
  }
  function setup_host(host){
    term.host=host
    term.term = new Terminal({
      cursorBlink: true,
      theme: 'serverboards',
    })
    term.term.open(term.$el.find('pre.terminal')[0])
    term.term.on('data', send_data)
    term.term.on('resize', send_resize)
    term.end=undefined
    term.term.fit()

    // subscribe to new data at terminal
    var evname='terminal.data.received.'+host
    rpc.call("event.subscribe", [evname])
    rpc.on(evname, function(data){
      if (data.eof)
        return
      var newdata=atob(data.data64)
      //console.log("Got async data: %o", newdata)
      term.term.write(newdata)
      if (data.end != (term.end + newdata.length)){
        console.warn("Data end do not match. Maybe some data lost.")
      }
      term.end=data.end
    })
    update_tabs()
    poll_data()
  }
  function unsetup_host(){
    if (term.host){
      var evname='terminal.data.received.'+term.host
      rpc.call("event.unsubscribe", [evname])
      rpc.off(evname)
      term.term.destroy()
      term.host=undefined
    }
  }

  Promise.all([
    plugin.load(plugin_id+"/xterm.js"),
    plugin.load(plugin_id+"/xterm.css"),
    plugin.load(plugin_id+"/terminal.css")
  ]).then( () =>
    plugin.load(plugin_id+"/fit.js")
  ).then( () => {
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
        add_tab(config.service.config.url + " " + i, list[i][0])
      }
    }
    if (new_term){
      add_new_tab()
    }
    else{
      setup_host(term.tabs[0].host)
    }
  }).catch(function(e){
    Flash.error("Could not start SSH session\n\n"+e)
  })
  console.log(term)
  $(window).on('resize', viewport_resize)

  return function(){
    unsetup_host()
    $(window).off('resize', viewport_resize)
    term.$el.html('')
  }
}

Serverboards.add_screen("serverboards.core.ssh/terminal", main)
