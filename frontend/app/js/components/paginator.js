import React from 'react'

function PageItem({active, onChange, n}){
  return (
    <a className={`item ${ active ? "active" : ""}`} onClick={() => onChange(n)}>
      {n+1}
    </a>
  )
}

function Paginator({count, current, onChange, max}){
  let pages = []
  // May need be more dynamic.
  if (!max)
    max=13

  // simple case, not many pages.
  if (count<max){
    for (let i=0; i<count; i++){
      pages.push(
        <PageItem key={i} active={i==current} onChange={onChange} n={i}/>
      )
    }
    pages.push(
      <span key="max" className="item disabled" style={{flexGrow:max-count+6}}></span>
    )
  }
  else if (current<(max/2)){
    for (let i=0; i<max; i++){
      pages.push(
        <PageItem key={i} active={i==current} onChange={onChange} n={i}/>
      )
    }
    pages.push(
      <span key="dots1" className="item disabled">...</span>
    )
    pages.push(
      <PageItem key="max2" active={(count-1)==current} onChange={onChange} n={count-1}/>
    )
  }
  else{
    pages.push(
      <PageItem key="max3" active={0==current} onChange={onChange} n={0}/>
    )

    pages.push(
      <span key="dots2" className="item disabled">...</span>
    )
    const padding = Math.ceil(max/2)-1
    const start = Math.min(count-max, current - padding)
    const end = Math.min(count, current + padding)

    for (let i=start; i<end; i++){
      pages.push(
        <PageItem key={i} active={i==current} onChange={onChange} n={i}/>
      )
    }


    if (end<count){
      pages.push(
        <span key="dots3" className="item disabled">...</span>
      )
      pages.push(
        <PageItem key={end} active={(count-1)==current} onChange={onChange} n={count-1}/>
      )
    }
  }

  return (
    <div className="ui pagination menu" style={{width:"100%"}}>
      <a className={`item ${ current == 0 ? "disabled" : ""}`} onClick={() => { if (current>0) onChange(current -1) }}>
        <i className="left caret icon"/>
      </a>
      {pages}
      <a className={`right item ${ current == (count-1) ? "disabled" : ""}`} onClick={() => { if (current < count-1) onChange(current+1)}}>
        <i className="right caret icon"/>
      </a>
    </div>
  )
}

export default Paginator
