<template>
    <Button style="box-shadow: none !important;" class="export-btn" type="primary" @click="handleExport">导出结果</Button>
</template>

<script setup>
import { Button } from 'ant-design-vue';

const props = defineProps({
    stringInfo: {
        type: Array,
        required: true
    }
});

// 新增格式化组串号的函数
const formatStringNumber = (key) => {
    try {
        const matches = key.match(/BT(\d+),I(\d+),PVINV_DCI(\d+)/);
        if (matches) {
            const [, boxNum, inverterNum, stringNum] = matches;
            const formattedBox = boxNum.padStart(3, '0');
            const formattedInverter = inverterNum.padStart(3, '0');
            const formattedString = stringNum.padStart(3, '0');
            return `${formattedBox}-${formattedInverter}-${formattedString}`;
        }
        return key; 
    } catch (error) {
        console.error('格式化组串号失败:', error);
        return key;
    }
};

const handleExport = () => {
    if (!props.stringInfo || !props.stringInfo[0]) return;
    
    const level4Items = [];
    const traverseTree = (node) => {
        if (node.level === 4) {
            level4Items.push({
                组串号: formatStringNumber(node.key),
                异常类型: node.anomalyIdentifier,
                异常值: node.anomalyValue,
                劣化率: node.degradeRate?.replace('%', '')
            });
            return;
        }
        if (node.children) {
            node.children.forEach(child => traverseTree(child));
        }
    };
    
    traverseTree(props.stringInfo[0]);
    
    // 分类数据
    const zeroCurrentAndDouble = level4Items
        .filter(item => item.异常类型 === 'zero' || item.异常类型 === 'double')
        .map(({ 组串号, 异常类型 }) => ({ 
            组串号, 
            异常类型: 异常类型 === 'zero' ? '零电流' : '单口接两串'
        }));
        
    const otherAnomalies = level4Items
        .filter(item => item.异常类型 !== 'zero' && item.异常类型 !== 'double')
        .map(({ 组串号, 异常值, 劣化率 }) => ({ 
            组串号, 
            异常值: Number(异常值), 
            劣化率: Number(劣化率) 
        }))
        .sort((a, b) => b.异常值 - a.异常值);

    // 导出文件
    const exportJSON = (data, filename) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    exportJSON(zeroCurrentAndDouble, 'special_anomalies.json');
    exportJSON(otherAnomalies, 'sorted_anomalies.json');
};
</script>

<style scoped>

</style>