  // 分支切换与cleanup
  // 思路：
  // 1.添加 effectFn.deps 属性，该属性是一个数组，用来存储所有包含当前副作用函数的依赖集合
  // 2.根据 effectFn.deps 获取所有相关联的依赖集合，进而将副作用函数从依赖集合中移除
  // 响应式处理
  const bucket = new WeakMap();
  const data = {ok:true,text:'hello world'}
  let activeEffect;
  // new
  function effect(fn) {
    const effectFn = ()=>{
      // 调用cleanup 函数完成清除工作
      cleanup(effectFn)
      // 当effectFn执行时候，将其设置为当前激活的副作用函数
      activeEffect = effectFn
      fn()
    }
    // activeEffect.deps 用来存储所有与该副作用函数相关联的依赖集合,track中收集依赖集合
    effectFn.deps = []
    effectFn()
  }

  // new
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
  // new
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

  // new  解决无限循环问题
  const effectsToRun = new Set(effects)
  effectsToRun.forEach(effectFn=>effectFn())
  // effects&&effects.forEach(fn=>fn())
}



//   使用

effect(function effectFn(){
  console.log('effectFn')
  document.body.innerText = obj.ok ? obj.text : 'not'
})


setTimeout(()=>{
  obj.ok =false
},1000)

setTimeout(()=>{
  obj.text ='hello vue3'
},1000)