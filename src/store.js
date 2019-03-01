import Vue from "vue";
import Vuex from "./vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    count: 100,
    a: {
      count: 300,
      b: {}
    }
  },
  getters: {
    newCount(state) {
      return state.count + 100;
    }
  },
  mutations: {
    change(state) {
      state.count += 10;
    }
  },
  actions: {
    change({ commit }) {
      setTimeout(() => {
        commit("change");
      }, 1000);
    }
  }
});
