  // watch  竞态问题
  
  // 响应式处理
  const bucket = new WeakMap();
  const data = {foo:1,bar:2}
  let activeEffect;

  const effectStack = [];

  function effect(fn,options) {
    const effectFn = ()=>{
      // 调用cleanup 函数完成清除工作
      cleanup(effectFn)
      // 当effectFn执行时候，将其设置为当前激活的副作用函数
      activeEffect = effectFn
      // 调用之前入栈
      effectStack.push(effectFn)
      // 存储执行结果
      const res = fn()
      // 调用之后出栈,并更新activeEffect
      effectStack.pop()
      activeEffect = effectStack[effectStack.length-1]
      return res
    }
    // 将option挂载到effectfn
    effectFn.options = options

    // activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合,track中收集依赖集合
    effectFn.deps = []
    if(!options.lazy){

      effectFn()
    }
    return effectFn
  }
function cleanup(effectFn){
  // 遍历effectFn.deps数组
  for(let i =0;i<effectFn.deps.length;i++){
    const deps = effectFn.deps[i]
    // 将effectfn从依赖集合中移除
    deps.delete(effectFn)
  }
  // 重置数组
  effectFn.deps.length = 0
}

  const obj = new Proxy(data,{
    get(target,key){
     track(target,key)
      return target[key]
    },
  
    set(target,key,newVal){
        target[key] = newVal
      trigger(target,key)
    }
    })
  
function track(target,key){
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
  // deps 就是一个与当前副作用函数存在联系的依赖集合
  // 将其添加到activeEffect.deps数组中
  activeEffect.deps.push(deps)
}

function trigger(target,key){
  //根据target从桶中取得depsmaps，它是key--》effects
  const depsMap = bucket.get(target)
  if(!depsMap) return
  // 根据key取出所以副作用函数
  const effects = depsMap.get(key)
  const effectsToRun = new Set(effects)
  effectsToRun.forEach(effectFn=>{
    // 如果trigger触发执行的副作用函数与当前执行的副作用函数相同，则不触发执行
    if(effectFn!== activeEffect){
      effectsToRun.add(effectFn)
    }
  })

  effectsToRun.forEach(effectFn=>{
    // 如果一个副作用函数存在调度器，则调用调度器，并将副作用函数作为参数传递
    if(effectFn.options.scheduler){
      effectFn.options.scheduler(effectFn)
    }else{
      effectFn()
    }
  })
}



// 定义一个任务队列
const jobQueue = new Set()
// 创建promise实例，用它把任务添加到微任务队列
const p = Promise.resolve()

// 标志是否正在刷新队列
let isFlushing = false
function flushJob(){
  console.log('flushJob')
  // 正在刷新时候，do nothing
  if(isFlushing){
    return
  }
// 设置为正在刷新
  isFlushing = true
p.then(()=>{
  console.log("jobQueue",jobQueue)
  jobQueue.forEach(job=>job())
}).finally(()=>{
  // 结束后重置状态
  isFlushing = false
})
}


//   使用
// new watch 
function watch(source,cb){
  effect(
    // 触发读取操作，建立联系
    ()=>source.foo,
    // 递归的读取
    // ()=>traverse(source),
    {
      scheduler(){
        // 数据变化时，调用回调
        cb()
      }
    }
    )
}

function traverse(value,seen = new Set()){
  // 如果读取值是原始值或者已经被读取过，就什么都不做
  if(typeof value !== 'object'||value==null||seen.has(value)){
    return
  }
  // 将数据添加到seen，代表已经读取，避免循环引用进入死循环
  seen.add(value)

  // 假设value是对象，通过循环读取每个值，并递归的调用traverse

  for(const k in value){
    traverse(value[k],seen)
  }
  return value
}







// 使用
// new  
function watch(source,cb){
  let getter;
  // 如果source是函数说明用户传递的是getter，所以直接把source赋值给getter
  if(typeof source === 'function'){
    getter= source
  }else{
    getter=()=>traverse(source)
  }

  let newValue,oldValue;

  // 用于存储用户注册的过期回调
  let cleanup
  function onInvalidate(fn){
    // 将过期回调存入cleanup
    cleanup = fn
  }
  // 提取scheduler调度函数作为一个job函数
  const job = ()=>{
  // 执行获得新的值
  newValue = effectFn()
  // 在调用回调函数之前先调用过期回调
  if(cleanup){
    cleanup()
  }
  // 将onInvalidate作为回调函数的参数
  cb(oldValue,newValue,onInvalidate)
  // 更新旧值
  oldValue = newValue
  }
  // 使用effect注册副作用函数时候，开启lazy选项，并把返回值存储到effectfn以便后续调用
  const effectFn =  effect(
    ()=>getter(),
    {
      lazy:true,
      // 使用job作为调度器函数
      scheduler:()=>{
        // post时候放入微任务队列执行
        if(option.flush === 'post'){
          const p = Promise.resolve()
          p.then(job)
        }else{//snyc时候
          job()
        }
      }
    }
    )


    if(option.immediate){
      // 如果设置立即执行，则直接执行job，从而触发回调函数
      job()
    }else{
    // 手动调用副作用函数拿到的就是旧值，第一次的值
    oldValue = effectFn()
    }

}

// vue中使用 onInvalidate
watch(obj,async(newValue,oldValue,onInvalidate)=>{
  // 标识函数是否过期
  let expired = false
  // 调用onInvalidate注册一个过期回调函数
  onInvalidate(()=>{
    // 过期时，为true
    expired = true
  })

  // 发送网络请求
  const res = await fetch('path/to/request')
  // 只有当函数没有过期时候才会继续执行
  if(!expired){
    finalData = res
  }

})


