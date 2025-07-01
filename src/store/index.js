import { createStore } from 'vuex'
import groupDetection from './modules/groupDetection';
import degradationOverview from './modules/degradationOverview';
import mergeDisplay from './modules/mergeDisplay';
import globalVar from './modules/globalVar';

const store = createStore({
    modules: {
      globalVar,
      groupDetection,
      degradationOverview,
      mergeDisplay // 新增模块
    },
  });
  
  export default store;
