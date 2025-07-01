import request from '@/utils/request'
import { message } from 'ant-design-vue'; // 引入 message 组件，用于/merge界面修改OCR结果的提示

const API = {
  STATION_URL: '/station/detail',
  STATION_DATA_URL: '/station/data',
  STATION_CHART_URL: '/station/chart',
  IMPUTE_URL: '/station/impute',
  REPAIR_URL: '/station/repair',
  SAVE_IMPUTE_URL: '/station/save',
  MERGE_URL: '/station/merge', // 新增/merge部分的接口
  FILE_URL: '/station/file',
  PREPROCESS_URL: '/station/preprocess',
  MERGE_IMAGE_URL: '/station/merge/image',
  MERGE_GEO_URL: '/station/merge/geo',
  MERGE_TABLE_URL: '/station/merge/table',
  MERGE_SAVE_URL: '/station/merge/saved',
  DIAGNOSIS_URL: '/station',
}

export const reqStationInfo = (
  station_name, start_time, end_time, variable
) =>
  request.get(
    API.STATION_URL +
    `?station_name=${station_name}&start_time=${start_time}&end_time=${end_time}&variable=${variable}`
  )

export const reqStationData = (
  station_name, device_id, start_time, end_time, variable
) =>
  request.get(
    API.STATION_DATA_URL + `?station_name=${station_name}&device_id=${device_id}&start_time=${start_time}&end_time=${end_time}&variable=${variable}`
  )

export const reqStationChart = (
  start_time, station_name, device_id, variable
) =>
  request.get(
    API.STATION_CHART_URL + `?start_time=${start_time}&station_name=${station_name}&device_id=${device_id}&variable=${variable}`
  )


export const reqImpute = (start_time, station_name, device_id, variable) =>
  request.get(
    API.IMPUTE_URL + `?start_time=${start_time}&station_name=${station_name}&device_id=${device_id}&variable=${variable}`
  )
export const reqRepair = (start_time, station_name, device_id, variable) =>
  request.get(
    API.REPAIR_URL + `?start_time=${start_time}&station_name=${station_name}&device_id=${device_id}&variable=${variable}`
  )

export const reqSaveImputeResult = (data) =>
  request.post(API.SAVE_IMPUTE_URL, data)

export const reqJsonFileState = async (station_name,process_date) => {
  try {
    const response = await request.get(API.FILE_URL, {
      params: {
        station_name,
        process_date
      }
    })

    const jsonFileState = response.json_file_state;
    return jsonFileState;
  } catch (error) {
    console.error('请求失败：', error);
    throw error;
  }
}

export const reqRunProcess = async (station_name,process_date) => {
  try {
    const response = await request.get(API.PREPROCESS_URL, {
      params: {
        station_name,
        process_date
      }
    })

    const isSuccess = response.is_success;
    const messageContent = response.message;
    return {
      isSuccess,
      messageContent
    };
  } catch (error) {
    console.error('请求失败：', error);
    throw error;
  }
}

export const reqMergeImage = async (areaName, imageName) => {
  try {
    const response = await request({
      url: API.MERGE_IMAGE_URL,
      method: 'get',
      params: {
        area_name: areaName,
        image_name: imageName
      },
      responseType: 'blob' // 关键点：指定返回类型为blob
    });
    // 创建一个对象URL来引用返回的图像
    const imageBlob = new Blob([response], { type: 'image/jpeg' });// 根据需要替换 MIME 类型
    return URL.createObjectURL(imageBlob);
  }
  catch (error) {
    console.error('获取图片失败：', error);
    throw error; // 根据需要抛出错误，或者做其他错误处理
  }
};

export const reqMergeGeo = async (areaName) => {
  try {
    const response = await request.get(API.MERGE_GEO_URL, {
      params: {
        area_name: areaName
      }
    });
    const panelJson = response.panel_geo;
    const panelLabelJson = response.panel_geo_label;

    return {
        panelJson,
        panelLabelJson
    };
    } catch (error) {
      console.error('请求失败：', error);
  }
}

export const reqMergeTable = async (areaName) => {
  try {
    const response = await request.get(API.MERGE_TABLE_URL, {
      params: {
        area_name: areaName
      }
    });
    return response;
  } catch (error) {
      // 判断是否为 404 错误
      if (error.response && error.response.status === 404) {
        // 弹出提示框
        alert('匹配数据文件不存在！');
      } else {
          console.error('请求失败：', error);
      }
      throw error; // 可以根据需要抛出错误，或者做其他错误处理
  }
}

export const reqMergeSaved = async (matchData, ocrData, areaName) => {
  // 将 matchData 的键转换为字符串
  const stringKeyMatchData = Object.fromEntries(
    Object.entries(matchData).map(([key, value]) => [String(key), value])
  );

  // 将 ocrData 的键转换为字符串
  const stringKeyOcrData = Object.fromEntries(
    Object.entries(ocrData).map(([key, value]) => [String(key), value])
  );

  try {
    const response = await request.post(API.MERGE_SAVE_URL, {
      match_data: stringKeyMatchData,
      ocr_data: stringKeyOcrData,
      area_name: areaName
    });
    
    message.success('保存成功！');
    return response;
  } catch (error) {
    message.error('保存失败！');
    throw error;
  }
};


export const reqDiagnosisList = (station, date, param1, param2) =>
 
  request.get(
    API.DIAGNOSIS_URL + `/station_diagnosis?station_name=${station}&date=${date}&sample_factor=${param1}&sample_size=${param2}`)
  

export const reqDiagnosisString = (station, date,box_id,inverter_id,string_id) =>
  request.get(
    API.DIAGNOSIS_URL + `/string_diagnosis?station_name=${station}&date=${date}&box_id=${box_id}&inverter_id=${inverter_id}&string_id=${string_id}`
  )

export const reqOssCredentials = () =>
  request.post(
    'http://api1.zklf-tech.com/api/component/oss/getCredentials'
  )
  
export const reqPictureInfo = () =>
  request.get(
     'API.DIAGNOSIS_URL + `/.....`'
  )
    

