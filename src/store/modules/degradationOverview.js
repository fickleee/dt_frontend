// store/modules/degradationOverview.js
import { getStringInfo } from '@/api/detect/detect'

const state = {
  stringInfo: [],
  selectPV: '', // 新增状态，保存选中项
  selectInverter: '',//DTZJJK-CDTGF-Q1-BT001-I001
  selectString: '',//BT001-I001-PV1
  selectStringCurrent: [],
  irradianceData: [],
  inverterStringCurrentData: []
}

const getters = {
  getStringInfo: (state) => state.stringInfo,
  getSelectedPV: (state) => state.selectPV,
  getSelectedInverter: (state) => state.selectInverter,
  getSelectedStringCurrent: (state) => state.selectStringCurrent,
  getIrradianceData: (state) => state.irradianceData,
  getSelectedString: (state) => state.selectString,
  getInverterStringCurrentData: (state) => state.inverterStringCurrentData
}

const mutations = {
  setstringInfo(state, payload) {
    state.stringInfo[0] = payload
  },
  setSelectPV(state, payload) {
    state.selectPV = payload
  },
  setSelectInverter(state, payload) {
    state.selectInverter = payload
  },
  SET_CURRENT_DATA(state, payload) {
    state.selectStringCurrent = payload
  },
  setIrradianceData(state, payload) {
    state.irradianceData = payload
  },
  setSelectString(state, payload) {
    state.selectString = payload
  },
  setInverterStringCurrentData(state, payload) {
    state.inverterStringCurrentData = payload
  }
}
const actions = {
  updatestringInfo({ commit }, payload) {
    commit('setstringInfo', payload)
  },
  updateSelectPV({ commit }, payload) {
    commit('setSelectPV', payload)
  },
  updateSelectInverter({ commit }, payload) {
    commit('setSelectInverter', payload)
  },
  updateSelectString({ commit }, payload) {
    commit('setSelectString', payload)
  },
  updateSelectStringCurrent({ commit }, payload) {
    commit('setInverterStringCurrentData', payload)
  },
  async fetchStringInfo({ commit, rootState }) {
    try {
      const response = await getStringInfo(
        rootState.globalVar.selectedDate,
        rootState.globalVar.selectedStation
      )
      commit('setstringInfo', response)
    } catch (error) {
      commit('setstringInfo', [])
      console.error('Error fetching degradation list:', error)
    }
  },
  async processInverterStringCurrentData({ state, commit, rootState }) {
    const selectInverter = state.selectInverter
    if (!selectInverter) {
      commit('setInverterStringCurrentData', [])
      return
    }

    // 解析selectInverter格式：DTZJJK-CDTGF-Q1-BT001-I001
    const parts = selectInverter.split('-')
    if (parts.length < 5) {
      commit('setInverterStringCurrentData', [])
      return
    }
    
    const btPart = parts[3] // BT001
    const iPart = parts[4]  // I001
    
    // 递归查找函数
    function findStringsByInverter(nodes, targetBT, targetI) {
      let result = []
      
      for (const node of nodes) {
        if (node.level === 4 && node.key) {
          const keyParts = node.key.split(',')
          if (keyParts.length >= 5 && keyParts[3] === targetBT && keyParts[4] === targetI) {
            // 提取PV名称（如从PVINV_DCI1提取PV1）
            const pvName = keyParts[5] ? keyParts[5].replace('PVINV_DCI', 'PV') : 'PV'
            result.push({
              stringName: pvName,
              historyIntensity: node.historyIntensity || []
            })
          }
        }
        
        // 递归查找子节点
        if (node.children && node.children.length > 0) {
          result = result.concat(findStringsByInverter(node.children, targetBT, targetI))
        }
      }
      
      return result
    }
    
    // 从 stringInfo 中获取逆变器下所有组串的历史电流数据
    const stringDataList = findStringsByInverter(state.stringInfo, btPart, iPart)
    if (stringDataList.length === 0) {
      commit('setInverterStringCurrentData', [])
      return
    }
    
    // 生成7天的时间序列（从selectedDate往前推7天，包括当天）
    const selectedDate = new Date(rootState.globalVar.selectedDate)
    const timePoints = []
    
    for (let day = 6; day >= 0; day--) {
      const currentDate = new Date(selectedDate)
      currentDate.setDate(selectedDate.getDate() - day)
      
      for (let hour = 0; hour < 24; hour++) {
        const timePoint = new Date(currentDate)
        timePoint.setHours(hour, 0, 0, 0)
        timePoints.push(timePoint.toISOString().slice(0, 19).replace('T', ' '))
      }
    }
    
    // 转换为LinePlot组件需要的格式
    const processedData = timePoints.map((time, index) => {
      const dataPoint = { 时间: time }
      
      // 为每个组串添加电流数据，直接按索引获取historyIntensity中的值
      stringDataList.forEach((stringData) => {
        const currentValue = stringData.historyIntensity[index] || 0
        dataPoint[`${stringData.stringName}输入电流`] = currentValue
      })
      
      return dataPoint
    })
    
    commit('setInverterStringCurrentData', processedData)
  }
  // // 修改：当选择的逆变器改变时，自动处理数据
  // async updateSelectInverter({ commit, dispatch }, payload) {
  //   commit('setSelectInverter', payload)
  //   // 自动处理新选择的逆变器的组串电流数据
  //   await dispatch('processInverterStringCurrentData')
  // }
}
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
