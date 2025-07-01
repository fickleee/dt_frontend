const state = {
    selectedDate: '2025-03-31', 
    selectedStation: 'datu', 
    isAuthenticated: false,
    userType: 'user'
}

const getters = {
    getSelectedDate: state => state.selectedDate,
    getSelectedStation: state => state.selectedStation,
};

const mutations = {
    setSelectedDate(state, selectedDate) {
        state.selectedDate = selectedDate;
    },
    setSelectedStation(state, selectedStation) {
        state.selectedStation = selectedStation;
    },
    setIsAuthenticated(state, isAuthenticated) {
        state.isAuthenticated = isAuthenticated
    },
    setUserType(state, userType) {
        state.userType = userType
    }
}


export default {
    namespaced: true,
    state,
    getters,
    mutations
}