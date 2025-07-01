export const DEFAULT_WIDTH = 100;
export const STATIONS = [
    {
        label: '长大涂',
        value: 'datu',
    },
    {
        label: '唐景',
        value: 'tangjing',
    },
    {
        label: '唐云',
        value: 'tangyun',
    },
    {
        label: '二源',
        value: 'eryuan',
    },
    {
        label: '乌沙山',
        value: 'wushashan',
    },
    {
        label: '富阳',
        value: 'fuyang',
    },
    {
        label: '大峃',
        value: 'daxue',
    },
    {
        label: '马屿',
        value: 'mayu',
    }
]
export const STATIONS_CENTER_POINTS = {
    datu: [121.7740628678872, 29.132688824633203],
    daxue: [120.00284482940474, 27.795723346919292],
    eryuan: [120.04462528322932, 27.88493491727627],
    tangjing: [119.7478672583891, 28.000201369664943],
    tangyun: [120.22260178081854, 28.778381346030017],
    wushashan: [121.66456147097125, 29.504467718071123],
    fuyang: [119.53310605487738, 30.116981282642207],
    mayu: [120.41170298129404, 27.69612722991405] 
}

export const STATUS_COLORS = {
    LOW: '#adffa0',    // 绿色 - 正常状态（无异常）
    MEDIUM: '#e6d494',   // 黄色 - 警告状态（1-3次异常）
    HIGH: '#ffa0a0'      // 红色 - 错误状态（3次以上异常）
}

