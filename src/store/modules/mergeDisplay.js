// src/store/modules/mergeDisplay.js
const state = {
    matchJSONData: [],
    matchSelectedConnection: [],
    matchModifiedData: {},
    imageViewCoordinates: [],
    mapViewCoordinates: [],
    areaName: "默认名称",
    isDataUploaded: false,
    imagUrls: [],
};

const getters = {
    getMatchJSONData: state => state.matchJSONData,
    getMatchSelectedConnection: state => state.matchSelectedConnection,
    getMatchModifiedData: state => state.matchModifiedData,
    getImageViewCoordinates: state => state.imageViewCoordinates,
    getMapViewCoordinates: state => state.mapViewCoordinates,
    getAreaName: state => state.areaName,
    getIsDataUploaded: state => state.isDataUploaded,
    getImagUrls: state => state.imagUrls,
};

const mutations = {
    setMatchJSONData(state, matchJSONData) {
        state.matchJSONData = matchJSONData;
    },
    setMatchSelectedConnection(state, matchSelectedConnection) {
        state.matchSelectedConnection = matchSelectedConnection;
    },
    setMatchModifiedData(state, matchModifiedData) {
        state.matchModifiedData = matchModifiedData;
    },
    setImageViewCoordinates(state, imageViewCoordinates) {
        state.imageViewCoordinates = imageViewCoordinates;
    },
    setMapViewCoordinates(state, mapViewCoordinates) {
        state.mapViewCoordinates = mapViewCoordinates;
    },
    setAreaName(state, areaName) {
        state.areaName = areaName;
    },
    setIsDataUploaded(state, isDataUploaded) {
        state.isDataUploaded = isDataUploaded;
    },
    setImagUrls(state, imagUrls) {
        state.imagUrls = imagUrls;
    },
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
};
