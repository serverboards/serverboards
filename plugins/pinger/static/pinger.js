'strict mode'

var timeout_id, plugin_uuid
var ip = "192.168.1.1"
var rpc = Serverboards.rpc

function add_row(text, klass){
  var table=$('tbody#pinger')
  var cd=new Date()
  var time = ((cd.getHours() < 10)?"0":"") + cd.getHours() +":"+ ((cd.getMinutes() < 10)?"0":"") + cd.getMinutes() +":"+ ((cd.getSeconds() < 10)?"0":"") + cd.getSeconds();

  var tr=$(`<tr>`)
  var td
  td=$('<td>').text(time)
  tr.append(td)
  td=$('<td>').text(text).addClass(klass)
  tr.append(td)

  table.prepend(tr)

  while (table.find("tr").length>15)
    table.find("tr").last().remove()
}

function update(){
  clearTimeout(timeout_id)

  console.log("ping %o", ip)
  rpc.call(plugin_uuid+".ping", {ip: ip}).then(function(result){
    add_row(result.ms.toPrecision(4)+' ms')
    timeout_id = setTimeout( update, 1000 )
  }).catch(function(e){
    add_row('Timeout', 'error')

    timeout_id = setTimeout( update, 1000 )
  })
}

var re_hostname=RegExp("//([^/:]+)")

function main(_el, config){
  console.log("Called JS! %o", config)
  if (config && config.service){
    ip=config.service.config.ip
    if (!ip){
      var match = config.service.config.url.match(re_hostname)
      if (match)
        ip=match[1]
      else
        ip=config.service.config.url
    }
    $('input#ip').val(ip)
  }
  else {
    var nip = $('input#ip').val()
    if (nip)
      ip=nip
    else if (ip)
      $('input#ip').val(ip)
  }

  rpc.call("plugin.start",["serverboards.core.actions/cmd"]).then(function(uuid){
    plugin_uuid=uuid

    update()
  })

  $('button#reload').on('click',function(){
    $('tbody#pinger').html('')
    if (timeout_id)
      clearTimeout(timeout_id)
    ip = $('input#ip').val()
    update()
  })

  return function(){
    clearTimeout(timeout_id)
  }
}

Serverboards.add_screen("serverboards.core.pinger/pinger", main)
