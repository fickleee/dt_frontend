import request from '@/utils/request'

const requestUpload = async (formData) => {
  try {
    const response = await request.post('/merge-create-upload-files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('response', response);
    return response.imagesList;
  } catch (error) {
    console.error("上传文件失败");
    return [];
  } 
};

const requestImage = async (stationName, imageName) => {
  try {
      const imageResponse = await request.get('/merge-create-show-image',
        { 
          responseType: 'blob',
          params: {
              stationName: stationName,
              imageName: imageName
          }
        }
      );

      return URL.createObjectURL(imageResponse); // 返回 Base64 图片 URL
  } catch (error) {
      console.error('获取图片失败：', error);
      throw error; // 根据需要抛出错误，或者做其他错误处理
  }
}

const requestImageSave = async (stationName, imageName, rotation, rectangles) => {
  try {
      const response = await request.post('/merge-create-show-image-save', 
      {
        stationName: stationName,
        imageName: imageName,
        rotation: rotation,
        rectangles: rectangles  // 直接传数组
      }, {
        responseType: 'blob'
      });
      return URL.createObjectURL(response);
  } catch (error) {
      console.error('保存图片失败：', error);
      throw error;
  }
}

const requestModelDetection = async (stationName) => {
  try {
    // 设置超时时间（例如1小时）
    const response = await request.get('/merge-create-image-detect', {
      params: { stationName },
      timeout: 3600000, // 1小时超时
    });
    return response.status;
  } catch (error) {
    console.error('Error:', error);
    return 'error';
  }
};

const requestMergedImage = async (stationName, imageName) => {
  try {
      const imageResponse = await request.get('/merge-create-merged-image',
        { 
          responseType: 'blob',
          params: {
              stationName: stationName,
              imageName: imageName
          }
        }
      );

      return URL.createObjectURL(imageResponse); // 返回 Base64 图片 URL
  } catch (error) {
      console.error('获取图片失败：', error);
      throw error; // 根据需要抛出错误，或者做其他错误处理
  }
}

const requestMergedLabel = async (stationName, labelName) => {
    try {
        const labelResponse = await request.get('/merge-create-merged-label',
          { 
              params: {
                  stationName: stationName,
                  labelName: labelName
              }
          }
        );

        return labelResponse; // 获取到的标签数据
    } catch (error) {
        console.error('获取标签数据失败：', error);
        throw error; // 根据需要抛出错误，或者做其他错误处理
    }
}

const saveMergedLabel = async (stationName, labelName, saveData) => {
    try {
        const response = await request.post('/merge-create-save-merged-label',
          { 
            stationName: stationName,
            labelName: labelName,
            saveData: saveData 
          }
        );

        return response; // 返回响应
    } catch (error) {
        console.error('保存标签数据失败：', error);
        return null; // 返回 null 或者根据需要抛出错误
    }
}

const updateMergedLabel = async (stationName, labelName, saveData) => {
    try {
        const response = await request.post('/merge-create-update-merged-label',
          { 
            stationName: stationName,
            labelName: labelName,
            saveData: saveData 
          }
        );

        return response; // 返回响应
    } catch (error) {
        console.error('更新标签数据失败：', error);
        return null; // 返回 null 或者根据需要抛出错误
    }
}

const requestDivision = async (stationName, geoSplitData, bpSplitData) => {
  try {
    const response = await request.post('/merge-create-split', 
    {
      stationName: stationName,
      geoSplitData: geoSplitData,
      bpSplitData: bpSplitData,
    });
    console.log('分割结果:', response);
    return response.status;
  } catch (error) {
    console.error('Error:', error);
    return 'error';
  }
};

const requestGeoData = async (stationName) => { 
    try {
        const response = await request.get('/merge-create-geojson',
            {
                params: {
                    stationName: stationName,
                },
            }
        );

        return response;
    }
    catch (error) {
        console.error('Error fetching geo data:', error);
        return null;
    }
}

export { requestUpload, requestImage, requestImageSave, requestModelDetection,
    requestMergedImage, requestMergedLabel, saveMergedLabel, updateMergedLabel,
    requestDivision, requestGeoData
 };