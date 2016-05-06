import React from 'react';

require("../../sass/logoicon.sass")

function logo(name){
  let ns=name.split(' ')
  if (ns.length>=2){
    return ns.map((n) => n[0]).join('').slice(0,2).toUpperCase()
  }
  return name.slice(0,2).toUpperCase()
}

const color_set=["red","orange","yellow","olive","green","teal","blue","violet","purple","pink","brown","grey"]
/// Returns a random nice color for the logo icon
function random_color(str){
  // From http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
  // http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
  function hash(str) {
    var hash = 0, i, chr, len;
    if (str.length === 0) return hash;
    for (i = 0, len = str.length; i < len; i++) {
      chr   = str.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  };

  return color_set[hash(str)%color_set.length]
}


function LogoIcon(props){
  let color=props.color
  if (!color){
    color=random_color(props.name)
  }

  return (
    <div className={`ui logoicon ${color}`}><span>{logo(props.name)}</span></div>
  )
}

export default LogoIcon
