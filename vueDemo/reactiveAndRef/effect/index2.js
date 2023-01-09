  // 响应式处理
  const bucket = new Set()

  const data = {text:'hello world'}
  // new
  let activeEffect;
  function effect(fn){
    activeEffect = fn;
    fn()
  }

  const obj = new Proxy(data,{
  get(target,key){
    // new
    if(activeEffect){
      bucket.add(activeEffect)
    }
      return target[key]
  },
  set(target,key,newVal){
      target[key] = newVal
      bucket.forEach(fn=>fn())
      return true
  }
  })


//   使用

effect(function effectFn(){
  console.log("effect run")
  document.body.innerText = obj.text
})
setTimeout(()=>{
  // obj.text="change"
  obj.notExist ="change"
},1000)