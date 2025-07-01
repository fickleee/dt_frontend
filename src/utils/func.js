import { message } from 'ant-design-vue';
import { reqJsonFileState } from '@/api';

export const checkJsonFileState = async (currentStation,currentDate) => {
    const result = await reqJsonFileState(currentStation,currentDate);
    if (!result) {
        message.error(`当前电厂的${currentDate}结果未出！`,5);
    }
    return result;
}