'strict mode';

var rpc = Serverboards.rpc
var plugin_id = 'serverboards.backup_manager'

function basename(filepath){
  var parts=filepath.split('/')
  if (parts.length==0)
    return ''
  return parts[parts.length-1]
}

// from MDN https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
function hex(buffer) {
  var hexCodes = [];
  var view = new DataView(buffer);
  for (var i = 0; i < view.byteLength; i += 4) {
    // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
    var value = view.getUint32(i)
    // toString(16) will give the hex representation of the number without padding
    var stringValue = value.toString(16)
    // We use concatenation and slice for padding
    var padding = '00000000'
    var paddedValue = (padding + stringValue).slice(-padding.length)
    hexCodes.push(paddedValue);
  }

  // Join all the hex strings into one
  return hexCodes.join("");
}

function old_backup(date){
  // must match today date or yesterdays
  var today = (new Date()).toISOString().slice(0,10)
  var yesterday_d = new Date()
  yesterday_d.setDate(yesterday_d.getDate()-1)

  var yesterday = yesterday_d.toISOString().slice(0,10)
  return date == today || date == yesterday
}

function main(element, config){
  console.log("watcher ready2")
  console.log(config)
  rpc.call("rules.list", {serverboard: config.serverboard.shortname}).then(function(list){
    var table = $('<table class="ui very basic table"><thead><tr><th/><th>File/server</th><th>Last ok</th></table>')

    var tbody=$('<tbody style="max-width: 320px;">')
    table.append(tbody)

    var trs = list.filter(function(el){
      return el.trigger.trigger == "serverboards.backup_manager/file_exists"
    }).map(function(el){
      console.log(el)
      var tr=$('<tr style="cursor: pointer;">')
      var color, description
      if (el.is_active){
        color="yellow"
        description="Loading..."
      }
      else{
        color="grey"
        description="Rule not active"
      }
      var is_on=$('<span class="ui label circular small '+color+'" data-tooltip="'+description+'" style="margin-left: 5px;"/>')
      tr.append($('<td style="padding-right: 0px;">').append(is_on))
      var filename=el.trigger.params.file_expression
      var filename_el = $('<div class="ui oneline">').text(basename(filename)).attr('data-tooltip', filename)
      var servername_el = $('<div class="ui meta">').text("---")
      rpc.call("service.info",[el.service]).then(function(service){
        servername_el.text(service.name)
      })
      var date=$('<span>...</span>')
      var to_check = new TextEncoder("utf-8").encode(filename + "-" + el.service);
      crypto.subtle.digest("SHA-256", to_check).then( (sha) => {
        var key="test-"+hex(sha)
        console.log("Get data for %o", key)
        return rpc.call("plugin.data_get",[plugin_id, key])
      } ).then( (data) => {
        console.log(data)
        filename_el.text(basename(data.filename)).attr('data-tooltip', data.filename)

        date.text(data.datetime.slice(0,16).replace('T',' '))
        is_on.removeClass("yellow")
        if (old_backup(data.datetime))
          is_on.addClass("red")
        else
          is_on.addClass("green")
      }).catch((e) => {
        date.text("Error").attr('data-tooltip', e)
        Serverboards.Flash.error("Could not get last backup date")
        is_on.addClass("red")
      })


      var file_server = $('<div>').append(filename_el).append(servername_el)
      tr.append($('<td style="max-width: 160px; padding-right: 0px;">').append(file_server))
      tr.append($('<td>').append(date))

      tr.on('click', function(){
        window.location.hash='/serverboard/SBDS/rules/'+el.uuid
      })

      return tr
    })

    tbody.append(trs)

    $(element).html(table)
  })
}
console.log("watcher ready")

Serverboards.add_widget(plugin_id+"/watcher", main)
