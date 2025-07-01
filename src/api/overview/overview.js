import request from '@/utils/request'

const API = {
    GET_OVERVIEW_STATION_MAP: '/overview/station-map',
    GET_OVERVIEW_STATION_INFO: '/overview/station-info',
}


export const reqOverviewStationMap = async (station_name,process_date) => {
    try {
        const mapResponse = await request.get(API.GET_OVERVIEW_STATION_MAP, {
            params: {
                station_name,
                process_date,
            }
        })
      // 直接从响应中提取数据
      const panelJson = mapResponse.panel_geo;
      const panelLabelJson = mapResponse.panel_geo_label;
  
      return {
        panelJson,
        panelLabelJson
      };
    } catch (error) {
      console.error('请求失败：', error);
      throw error; // 抛出错误，以便调用方处理
    }
}

export const reqOverviewStationInfo = async (station_name,process_date) => {
  try {
      const infoResponse = await request.get(API.GET_OVERVIEW_STATION_INFO, {
          params: {
              station_name,
              process_date,
          }
      })

    const degradationInfo = infoResponse.degradation_info;
    const anomalyInfo = infoResponse.anomaly_info;
    const powerInfo = infoResponse.power_info;
    const lossInfo = infoResponse.loss_info;

    return {
      degradationInfo,
      anomalyInfo,
      powerInfo,
      lossInfo
    };
  } catch (error) {
    console.error('请求失败：', error);
    throw error; // 抛出错误，以便调用方处理
  }
}

export default API