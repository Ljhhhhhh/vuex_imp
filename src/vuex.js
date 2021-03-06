let Vue;

class ModuleCollection {
  constructor(options) {
    this.register([], options);
  }
  register(path, rawModule) {
    let newModule = {
      _raw: rawModule, // 当前有state/getters的对象
      _children: {}, // 表示他包含的对象
      state: rawModule.state //自己模块的状态
    };
    if (path.length === 0) {
      this.root = newModule;
    } else {
      let parent = path.slice(0, -1).reduce((root, current) => {
        return root._children[current];
      }, this.root);
      parent._children[path[path.length - 1]] = newModule;
    }
    if (rawModule.modules) {
      forEach(rawModule.modules, (childName, module) => {
        this.register(path.concat(childName), module);
      });
    }
  }
}
function installModule(store, rootState, path, rootModule) {
  if (path.length > 0) {
    let parent = path.slice(0, -1).reduce((root, current) => {
      return root[current];
    }, rootState);
    Vue.set(parent, path[path.length - 1], rootModule.state);
  }
  if (rootModule._raw.getters) {
    forEach(rootModule._raw.getters, (getterName, getterFn) => {
      Object.defineProperty(store.getters, getterName, {
        get: () => {
          return getterFn(rootModule.state);
        }
      });
    });
  }
  if (rootModule._raw.actions) {
    forEach(rootModule._raw.actions, (actionName, actionFn) => {
      let entry = store.actions[actionName] || (store.actions[actionName] = []);
      entry.push(() => {
        actionFn.call(store, store);
      });
    });
  }
  if (rootModule._raw.mutations) {
    forEach(rootModule._raw.mutations, (mutationName, mutationFn) => {
      let entry =
        store.mutations[mutationName] || (store.mutations[mutationName] = []);
      entry.push(() => {
        mutationFn.call(store, rootModule.state);
      });
    });
  }
  forEach(rootModule._children, (childName, module) => {
    installModule(store, rootState, path.concat(childName), module);
  });
}
class Store {
  constructor(options) {
    let state = options.state;
    this.getters = {};
    this.mutations = {};
    this.actions = {};
    // vuex核心借用了vue的实例，因为vue的实例数据变化会刷新视图
    this._vm = new Vue({
      data: {
        state
      }
    });

    // 模块关系整理
    this.modules = new ModuleCollection(options);
    installModule(this, state, [], this.modules.root);
    // if (options.getters) {
    //   let getters = options.getters;
    //   forEach(getters, (getterName, getterFn) => {
    //     Object.defineProperty(this.getters, getterName, {
    //       get: () => {
    //         return getterFn(state);
    //       }
    //     });
    //   });
    // }
    // let mutations = options.mutations;
    // forEach(mutations, (mutationName, mutationFn) => {
    //   this.mutations[mutationName] = () => {
    //     mutationFn.call(this, state);
    //   };
    // });
    // let actions = options.actions;
    // forEach(actions, (actionName, actionFn) => {
    //   this.actions[actionName] = () => {
    //     actionFn.call(this, this);
    //   };
    // });
    let { commit, dispatch } = this;
    this.commit = type => {
      commit.call(this, type);
    };
    this.dispatch = type => {
      dispatch.call(this, type);
    };
  }
  get state() {
    return this._vm.state;
  }
  commit(type) {
    this.mutations[type]();
  }
  dispatch(type) {
    this.actions[type]();
  }
}

function forEach(obj, callback) {
  Object.keys(obj).forEach(item => callback(item, obj[item]));
}

let install = _Vue => {
  Vue = _Vue;
  Vue.mixin({
    beforeCreate() {
      if (this.$options && this.$options.store) {
        this.$store = this.$options.store;
      } else {
        this.$store = this.$parent && this.$parent.$store;
      }
    }
  });
};

export default {
  Store,
  install
};
