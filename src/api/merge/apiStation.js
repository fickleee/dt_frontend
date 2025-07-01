import request from '@/utils/request';

const API = {
    MERGE_DISPLAY_MAP: '/api/merge_display_map'
};

const fetchPanelData = async (stationValue) => {
    try {
        const response = await request.get(
            `${API.MERGE_DISPLAY_MAP}/${stationValue}`
        );
        const panelJson = response.panel_geo;
        const panelLabelJson = response.panel_geo_label;

        return {
            panelJson,
            panelLabelJson
        };
    } catch (error) {
        console.error('请求失败：', error);
        throw error;
    }
};

export { fetchPanelData };
