<template>
    <a-table ref="listTableRef" :columns="columns" :data-source="tableData" :row-selection="rowSelection" row-class-name="dark_bg" size="small"
        :pagination="false" :scroll="{ y: maxHeight}" style="height: 100%;">
        <template #title>
            <div style="font-weight: bold" v-text="title"></div>
            <a-button size="small" shape="round" @click="handleModel(chosen_series)">确认</a-button>
        </template>
        <template #bodyCell="{ column, record }">
            <div v-if="column.key != 'name'" style="display: flex; align-items: center">
                <p v-if="record.level == undefined || record.level == 4" :style="{
                    borderRadius: '50%',
                    width: '15px',
                    height: '15px',
                    backgroundColor: getBackgroundColor(record[column.key], record, title),
                    display: 'inline-block',
                    margin: '0 5px 0 0'
                }"></p>
            </div>
            <div v-else>
                {{ formatName(record.name) }}
            </div>
        </template>

    </a-table>
</template>

<script setup>
import { ref, computed , onMounted, onUnmounted, nextTick} from 'vue'
import { STATUS_COLORS } from '@/utils/constants'
const props = defineProps({
  title: String,
  columns: Array,
  data: Array,
  detailColumnCount: Number,
  detailColumns: Array,
  handleModel: Function,
  otherHeight: Number
})

let chosen_series = ref('')


const listTableRef = ref(null); // 1. 给 a-table 添加 ref="listTableRef"
const maxHeight = ref(200); // 2. 可以设置一个初始的loading态高度，或任何默认值

const calculateMaxHeight = () => {
    if (listTableRef.value && listTableRef.value.$el) { // antd组件通常需要 .$el 访问根DOM元素
        const tableInstanceEl = listTableRef.value.$el;
        // parentEl 应该是 <div class="table"> in repairview.vue
        const parentEl = tableInstanceEl.parentElement; 

        if (parentEl) {
            const parentHeight = parentEl.clientHeight; // 获取父容器 <div class="table"> 的实际高度

            const titleEl = tableInstanceEl.querySelector('.ant-table-title'); // 获取表格标题栏元素
            const tableHeaderEl = tableInstanceEl.querySelector('.ant-table-thead'); // 获取表格头元素
            
            const titleHeight = titleEl ? titleEl.offsetHeight : 0;
            const antTableHeaderHeight = tableHeaderEl ? tableHeaderEl.offsetHeight : 0;
            
            // 计算分配给表格体（tbody）的滚动区域高度
            const calculatedBodyHeight = parentHeight - titleHeight - antTableHeaderHeight;
            
            maxHeight.value = Math.max(0, calculatedBodyHeight); 

        }
    } 
};

onMounted(() => {
    nextTick(() => {
        calculateMaxHeight();
    });
    window.addEventListener('resize', calculateMaxHeight);
});

onUnmounted(() => {
    window.removeEventListener('resize', calculateMaxHeight);
});



const tableData = computed(() => {
    return props.data && props.data[0] && props.data[0].children
        ? props.data[0].children
        : [];
});
const formatName = (name) => {
    return name ? name.replace(/^0+(\d+)/, '$1') : '';
}

const rowSelection = ref({
  checkStrictly: false,
  hideSelectAll: true,
  type: 'radio',
  getCheckboxProps: (record) => ({
    // 是否可选中逻辑
    disabled: record.key.split(',').length < 4 || (record.level !== undefined && record.level < 4)
  }),

    onChange: (selectedRowKeys) => {
        chosen_series.value = selectedRowKeys[0];
        // props.handleModel(chosen_series.value, selectedRowKeys);
    },

});

const getBackgroundColor = (rate, record, title) => {
    if (title == '低效识别结果'){
        if (record.diagnosisResults.length == 0){
            return STATUS_COLORS.LOW
        }
        else {
            if (record.degradeRate == 0){
                return STATUS_COLORS.LOW
            }
            if (record.degradeRate < 0.1){
                return STATUS_COLORS.MEDIUM
            }
            else{
                return STATUS_COLORS.HIGH
            }
        }
    }
    else{
        if (rate < 1) {
            return STATUS_COLORS.LOW
        } else if (rate <= 5) {
            return STATUS_COLORS.MEDIUM
        } else {
            return STATUS_COLORS.HIGH
        }
    }

}

</script>
<style>
.ant-table-title {
  display: flex;
  justify-content: space-between;
}
/*  新增滚动条样式 开始 */
.ant-table-wrapper .ant-table-body::-webkit-scrollbar,
.ant-table-wrapper .ant-table-content::-webkit-scrollbar { /* antd v4/v3 可能用 .ant-table-body, v5+ 可能用 .ant-table-content */
    width: 8px; /* 根据需要调整宽度 */
    height: 8px; /* 同时美化水平和垂直滚动条 */
}

.ant-table-wrapper .ant-table-body::-webkit-scrollbar-track,
.ant-table-wrapper .ant-table-content::-webkit-scrollbar-track {
    background: #2c2c2c; /* 滚动条轨道颜色，深色背景 */
    border-radius: 4px;
}

.ant-table-wrapper .ant-table-body::-webkit-scrollbar-thumb,
.ant-table-wrapper .ant-table-content::-webkit-scrollbar-thumb {
    background: #6b6b6b; /* 滚动条滑块颜色 */
    border-radius: 4px;
}

.ant-table-wrapper .ant-table-body::-webkit-scrollbar-thumb:hover,
.ant-table-wrapper .ant-table-content::-webkit-scrollbar-thumb:hover {
    background: #888888; /* 鼠标悬浮时滑块颜色 */
}
/*  新增滚动条样式 结束 */


/*  解决table内元素高度的问题 开始 */
/* :deep() */ .ant-table-wrapper {
    height: 100%; 
    border-radius: 10px; 
    overflow: hidden;   
}

/* :deep() */ .ant-table-wrapper > .ant-spin-nested-loading { /* 直属子元素 ant-spin-nested-loading */
    height: 100%;
}

/* :deep() */ .ant-table-wrapper > .ant-spin-nested-loading > .ant-spin-container { /* 再下一层的 ant-spin-container */
    height: 100%;
}

/* :deep() */ .ant-table-wrapper > .ant-spin-nested-loading > .ant-spin-container > .ant-table { /* 最终的 .ant-table 元素 */
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* ---- 一旦 .ant-table 元素成功应用了 display: flex; flex-direction: column; ---- */
/* ---- 那么下面的样式才会生效，用于分配其内部空间 ---- */

/* :deep() */ .ant-table-title,
/* :deep() */ .ant-table-thead > tr > th, /* 或者针对 .ant-table-header 整体 */
/* :deep() */ .ant-table-summary > table > tfoot > tr > td { /* 如果有表尾总结栏 */
    flex-shrink: 0; /* 防止标题、表头、表尾被压缩 */
}
/* :deep() */ .ant-table .ant-table-container .ant-table-header,
/* :deep() */ .ant-table .ant-table-header { 
    flex-shrink: 0;
}


/* :deep() */ .ant-table-body { 
    flex: 1; 
    overflow-y: auto !important; 
    min-height: 0; 
}

/*  解决table内元素高度的问题 结束 */

</style>

