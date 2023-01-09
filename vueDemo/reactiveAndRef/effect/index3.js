  // 响应式处理
  // const bucket = new Set()
  // new
  const bucket = new WeakMap();

  const data = {text:'hello world'}
  let activeEffect;
  function effect(fn){
    activeEffect = fn;
    fn()
  }

  const obj = new Proxy(data,{
  get(target,key){
    // new
    // 没有activeEffect，直接return
    if(!activeEffect) return target[key]
    // 根据target从桶中取得depsMap，它也是个Map类型：key--》effects
    let depsMap = bucket.get(target);
    // 如果没有，新建一个Map与target关联
    if(!depsMap) {
      bucket.set(target,(depsMap = new Map()));
    }

    // 再根据key从depsmap中取得deps，他是一个set类型，存储所有与当前key又关的副作用函数
    let deps = depsMap.get(key);
    // 如果deps不存在，同样新建一个set并于key关联
    if(!deps) {
      deps = new Set();
      depsMap.set(key,deps);
    }
    // 最后将当前激活的副作用函数添加到桶里。
    deps.add(activeEffect)
    return target[key]
  },

  set(target,key,newVal){
      target[key] = newVal
      // new
      //根据target从桶中取得depsmaps，它是key--》effects
      const depsMap = bucket.get(target)
      if(!depsMap) return
      // 根据key取出所以副作用函数
      const effects = depsMap.get(key)
      effects&&effects.forEach(fn=>fn())
  }
  })


  // 封装track和trigger
//   const obj = new Proxy(data,{
//     get(target,key){
//       // new
//      track(target,key)
//       return target[key]
//     },
  
//     set(target,key,newVal){
//         target[key] = newVal
//         // new
//       trigger(target,key)
//     }
//     })
  
// function track(target,key){
//   // 没有activeEffect，直接return
//   if(!activeEffect) return target[key]
//   // 根据target从桶中取得depsMap，它也是个Map类型：key--》effects
//   let depsMap = bucket.get(target);
//   // 如果没有，新建一个Map与target关联
//   if(!depsMap) {
//     bucket.set(target,(depsMap = new Map()));
//   }

//   // 再根据key从depsmap中取得deps，他是一个set类型，存储所有与当前key又关的副作用函数
//   let deps = depsMap.get(key);
//   // 如果deps不存在，同样新建一个set并于key关联
//   if(!deps) {
//     deps = new Set();
//     depsMap.set(key,deps);
//   }
//   // 最后将当前激活的副作用函数添加到桶里。
//   deps.add(activeEffect)
// }

// function trigger(target,key){
//   //根据target从桶中取得depsmaps，它是key--》effects
//   const depsMap = bucket.get(target)
//   if(!depsMap) return
//   // 根据key取出所以副作用函数
//   const effects = depsMap.get(key)
//   effects&&effects.forEach(fn=>fn())
// }



//   使用

effect(function effectFn(){
  console.log("effect run")
  document.body.innerText = obj.text
})
setTimeout(()=>{
  // obj.text="change"
  obj.notExist ="change"
},1000)