var timeout_id, plugin_uuid
var ip = "192.168.1.1"
var rpc = Serverboards.rpc

function update(){
  console.log("ping %o", ip)
  rpc.call(plugin_uuid+".ping", {ip: ip}).then(function(result){
    var table=$('tbody#pinger')
    if (table.length==0){ // There is no table, do not try again
      console.log("Stop pinger table")
      return;
    }
    var cd=new Date()
    var time = ((cd.getHours() < 10)?"0":"") + cd.getHours() +":"+ ((cd.getMinutes() < 10)?"0":"") + cd.getMinutes() +":"+ ((cd.getSeconds() < 10)?"0":"") + cd.getSeconds();

    var tr=$(`<tr>`)
    var td
    td=$('<td>').text(time)
    tr.append(td)
    td=$('<td>').text(result.ms.toPrecision(4)+' ms')
    tr.append(td)

    table.prepend(tr)

    while (table.find("tr").length>15)
      table.find("tr").last().remove()

    timeout_id = setTimeout( update, 1000 )
  })
}

function main(){
  console.log("Called JS! %o", Serverboards)
  var nip = $('input#ip').val()
  if (nip)
    ip=nip
  else if (ip)
    $('input#ip').val(ip)

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
}

main()
