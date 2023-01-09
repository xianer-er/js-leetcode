  // 计算属性和lazy
  
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
      // new
      // 存储执行结果
      const res = fn()
      // 调用之后出栈,并更新activeEffect
      effectStack.pop()
      activeEffect = effectStack[effectStack.length-1]
      // new
      return res
    }
    // 将option挂载到effectfn
    effectFn.options = options

    // activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合,track中收集依赖集合
    effectFn.deps = []
    // new
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


// new

// effect(()=>{
//   console.log(obj.foo)
// },
// // options
// {
//  lazy: true
// }
// )

// const effectFn = effect(
//   // 把传入的fn看做getter
//   ()=>{console.log(obj.foo)},
// // options
// {
//  lazy: true
// }
// )

// const value = effectFn()



// new 
// 实现计算属性

function computed(getter){
  // 缓存上一次的值
  let value 
  // 标识是否需要重新计算，true表示需要计算
  let dirty = true 

  // 把getter作为副作用函数，创建一个lazy的effect
  const effectFn = effect(getter,{
    lazy: true,
    scheduler(){
      dirty = true;
    }
  })
  const obj = {
    // 当读取value的时候才执行effectFn
    get value(){
      if(dirty){
        value = effectFn()
        dirty = false
      }
      return value
    }
  }
  console.log('obj',obj)
  return obj
}

const sumRes = computed(()=>{
return  obj.foo +obj.bar
  
})
console.log(sumRes.value)