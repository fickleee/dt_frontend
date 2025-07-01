import {
  getDimReductionData,
  getAnomalyHistory,
  performDetection
} from '@/api/detect/detect'

const state = {
  scatterData: null,
  anomalyHistory: null,
  dataLoaderVisible: false,
}

const getters = {
  scatterData: (state) => state.scatterData,
  anomalyHistory: (state) => state.anomalyHistory,
  dataLoaderVisible: (state) => state.dataLoaderVisible,
}

const actions = {
  async fetchDimReductionData({ commit, rootState }) {
    const result = await getDimReductionData(
      rootState.globalVar.selectedStation,
      rootState.degradationOverview.selectString,
      rootState.globalVar.selectedDate
    )
    commit('SET_SCATTER_DATA', result)
  },
  async fetchAnomalyHistory({ commit, rootState }) {
    const result = await getAnomalyHistory(
      rootState.globalVar.selectedStation,
      rootState.degradationOverview.selectString,
      rootState.globalVar.selectedDate
    )
    commit('SET_ANOMALY_HISTORY', result)
  },
  async performDetection({ commit, rootState }) {
    await performDetection(
      rootState.globalVar.selectedStation,
      rootState.globalVar.selectedDate
    )
    commit('SET_DATA_LOADER_VISIBLE', true)
  }
}

const mutations = {
  SET_ANOMALY_HISTORY(state, data) {
    state.anomalyHistory = data
  },
  SET_SCATTER_DATA(state, data) {
    state.scatterData = data
    state.scatterData = data
  },
  SET_DATA_LOADER_VISIBLE(state, data) {
    state.dataLoaderVisible = data
  },
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}

