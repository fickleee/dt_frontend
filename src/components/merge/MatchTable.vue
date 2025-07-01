<template>
    <div class="match-table">
        <div class="match-title">
            <p id="match-table-title">自动对齐结果</p>
            <a-button @click="saveToMatch">Save</a-button>
        </div>
        <a-table :columns="columns" :data-source="tableData" :row-selection="rowSelection"
            :row-class-name="getRowClassName" class="scrollable-table">
            <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'X_point'">
                    <span :class="{'green-text': selectedRowKeys.includes(record.key)}">{{ record.X_point }}</span>
                    <a-button v-if="record.is_child" size="small" style="margin-left: 8px;" @click="selectRow(record)">选择</a-button>
                </template>
            </template>
        </a-table>
    </div>
</template>
<script>
import { defineComponent, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { reqMergeSaved } from '@/api';
const columns = [
    {
        title: '组串标号',
        dataIndex: 'Y_transformed_point',
        key: 'Y_transformed_point',
        width: 130,
    },
    {
        title: '无人机标号',
        dataIndex: 'X_point',
        key: 'X_point',
        width: 75,
    },
    {
        title: '准确度',
        dataIndex: 'matched',
        key: 'matched',
        width: 75,
    },
];

// 定义表格数据的引用
const tableData = ref(null);
const cur_selected_connection = ref(null);
const keyValuePairs = ref([]);
export default defineComponent({
    setup() {
        const myStore = useStore();
        const selectedRowKeys = ref([]);
        const exportMatchData = ref([]);
        const exportOCRData = ref([]);

        
        const loadMatchData = () => {
            try {
                // 每次载入新电厂时，清空所有数据
                tableData.value = null;
                keyValuePairs.value = [];
                selectedRowKeys.value = [];
                exportMatchData.value = [];
                exportOCRData.value = [];
                curKeyValuePairs = {};
                cur_selected_connection.value = null;
                myStore.commit('mergeDisplay/setMatchModifiedData', {});
                myStore.commit('mergeDisplay/setMatchSelectedConnection', []);

                const data = matchDataProcess(myStore.state.mergeDisplay.matchJSONData);
                tableData.value = data;

                // 初始化键值对数组
                keyValuePairs.value = curKeyValuePairs;
            } catch (error) {
                console.error("加载数据时出错:", error);
            }
        };

        const matchDataProcess = (matches) => {
            return matches.map(match => {
                const matchKeys = Object.keys(match.matched_results);
                if (Object.keys(matchKeys).length > 0) {
                    if (matchKeys.length > 1) {
                      const children = matchKeys.slice(1).map(key => ({
                          key: `${match.merge_id}_${key}`,
                          Y_transformed_point: match.dpocr,
                          X_point: key,
                          matched: `${match.matched_results[key].proximity}%`,
                          X_reality: {x:match.matched_results[key].gpocx, y:match.matched_results[key].gpocy},
                          Y_path: match.dp_img_name,
                          Y_related: {
                              x1: match.dpclx,
                              x2: match.dpcrx,
                              y1: match.dpcly,
                              y2: match.dpcry
                          },
                          is_child: true,
                          merge_id: match.merge_id
                      }));
  
                      return { 
                          key: `${match.merge_id}_${matchKeys[0]}`,
                          Y_transformed_point: match.dpocr,
                          X_point: matchKeys[0],
                          matched: `${match.matched_results[matchKeys[0]].proximity}%`,
                          children: children,
                          X_reality: { x:match.matched_results[matchKeys[0]].gpocx, y:match.matched_results[matchKeys[0]].gpocy},
                          Y_path: match.dp_img_name,
                          Y_related: {
                              x1: match.dpclx,
                              x2: match.dpcrx,
                              y1: match.dpcly,
                              y2: match.dpcry
                          },
                          is_child: false,
                          merge_id: match.merge_id
                      };
                    }
                    else {
                        return { 
                            key: `${match.merge_id}_${matchKeys[0]}`,
                            Y_transformed_point: match.dpocr,
                            X_point: matchKeys[0],
                            matched: `${match.matched_results[matchKeys[0]].proximity}%`,
                            X_reality: { x:match.matched_results[matchKeys[0]].gpocx, y:match.matched_results[matchKeys[0]].gpocy},
                            Y_path: match.dp_img_name,
                            Y_related: {
                                x1: match.dpclx,
                                x2: match.dpcrx,
                                y1: match.dpcly,
                                y2: match.dpcry
                            },
                            is_child: false,
                            merge_id: match.merge_id
                        };
                    }
                }
            });
        }

        let curKeyValuePairs = {};

        const getRowClassName = (record) => {
            if (record.key in keyValuePairs) {
                return 'edited-row';
            }
            return 'my-table-row';
        };

        // 监视 主页面匹配数据加载的变化
        watch(() => myStore.state.mergeDisplay.matchJSONData, () => {
            loadMatchData();
        },);

        watch(() => cur_selected_connection.value, (newValue) => {
            if (newValue) {
                myStore.commit('mergeDisplay/setMatchSelectedConnection', newValue);
            }
        }, { immediate: true });

        // 监视 myStore.state.mergeDisplay.matchModifiedData 的变化
        watch(() => myStore.state.mergeDisplay.matchModifiedData, (newValue) => {
            if (Object.keys(newValue).length > 0) {
                curKeyValuePairs = newValue;

                // 确保 tableData.value 是一个有效的数组
                if (!Array.isArray(tableData.value)) {
                    console.warn("tableData.value is not an array");
                    return;
                }

                // 遍历 curKeyValuePairs 并更新 tableData.value 中对应的行
                for (const curKey in curKeyValuePairs) {
                    if (curKeyValuePairs.hasOwnProperty(curKey)) {
                        const curValues = curKeyValuePairs[curKey];

                        tableData.value.forEach(row => {
                            // 添加空值检查
                            if (row && row.key !== undefined && row.key === curKey) {
                                // 更新相关字段
                                row.Y_transformed_point = curValues;
                                exportOCRData.value[row.merge_id] = row.Y_transformed_point;
                            }
                        });
                    }
                }
            }
            else if (Object.keys(newValue).length === 0) {
                curKeyValuePairs = newValue;
            }

        }, { deep: true });

        const saveToMatch = async () => {
            const curAreaName = myStore.state.mergeDisplay.areaName;
            const res = await reqMergeSaved(exportMatchData.value, exportOCRData.value,curAreaName);
        }

        const exportToCSV = () => {
            // 只选取指定的三列
            const selectedColumns = columns.slice(0, 3);  // 假设这三列分别是前三个

            // 构建 CSV 内容
            let csvContent = `data:text/csv;charset=utf-8,${selectedColumns.map(column => column.title).join('\t')}\n`;  // 使用制表符作为分隔符

            // 遍历数据源并提取对应列的数据
            if (tableData.value && Array.isArray(tableData.value)) {
                tableData.value.forEach(row => {
                    // 更新 Y_transformed_point 使用 curKeyValuePairs
                    const originalGroupNumber = row.X_point;
                    if (curKeyValuePairs.hasOwnProperty(originalGroupNumber)) {
                        row.Y_transformed_point = curKeyValuePairs[originalGroupNumber];
                    }

                    const rowData = selectedColumns.map(column => {
                        // 处理包含逗号的数据
                        if (typeof row[column.dataIndex] === 'string' && row[column.dataIndex].includes(',')) {
                            return `"${row[column.dataIndex]}"`;  // 使用双引号包裹
                        }
                        return row[column.dataIndex];
                    });
                    csvContent += rowData.join('\t') + '\n';  // 使用制表符作为分隔符
                });
            }

            // 创建下载链接
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'export.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        const selectRow = (record) => {
            if (!selectedRowKeys.value.includes(record.key)) {
                selectedRowKeys.value.push(record.key);
            }
            
            // 如果 exportMatchData 中已经存在相同的 merge_id，则更新其 X_point
            if (exportMatchData.value.hasOwnProperty(record.merge_id)) {
                exportMatchData.value[record.merge_id] = record.X_point;
            } else {
                // 否则添加新的键值对
                exportMatchData.value[record.merge_id] = record.X_point;
            }
        };

        const rowSelection = {
            selectedRowKeys: selectedRowKeys, // 将选中行的 keys 传递给 rowSelection
            onChange: (keys, selectedRows) => {
                selectedRowKeys.value = keys; // 更新选中行的 keys
            },
            onSelect: (record, selected, selectedRows) => {
                cur_selected_connection.value = selectedRows[selectedRows.length - 1];
            },
            onSelectAll: (selected, selectedRows, changeRows) => {
            },
        };

        return {
            tableData,
            columns,
            rowSelection,
            keyValuePairs,
            getRowClassName,
            exportToCSV,

            selectedRowKeys,
            selectRow,
            saveToMatch,
            rowSelection,
        };
    },
});
</script>

<style scoped>
.match-table {
    height: 100%;
    width: 100%;
    background-color: #141414;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
}

#match-table-title {
    font-family: 'PT Sans', sans-serif;
    font-size: 16px;
    font-weight: 700;
    line-height: 20.7px;
    text-align: left;
    color: #333333;
    /* 深色文字，确保在浅色背景上可读性 */
    padding-left: 15px;
    /* padding-top: 15px; */
}

.match-title {
    display: flex;
    align-items: center;
}

#match-table-title {
    color: rgba(255, 255, 255, 0.85);
}

.match-title button {
    margin-right: 10px;
    margin-left: auto;
}

.green-text {

}
</style>