  // 响应式处理
  const bucket = new Set()

  const data = {text:'hello world'}

  const obj = new Proxy(data,{
  get(target,key){
      bucket.add(effect)
      return target[key]
  },
  set(target,key,newVal){
      target[key] = newVal
      bucket.forEach(fn=>fn())
      return true
  }
  })


//   使用
function effect(){
  document.body.innerText = obj.text
}
effect()
setTimeout(()=>{
  obj.text ="change"
},1000)