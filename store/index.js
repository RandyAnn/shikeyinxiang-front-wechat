import Vue from 'vue'
import Vuex from 'vuex'
import user from './modules/user'
import food from './modules/food'
import diet from './modules/diet'
import nutrition from './modules/nutrition'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    user,
    food,
    diet,
    nutrition
  }
}) 