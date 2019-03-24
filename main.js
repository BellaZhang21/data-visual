let wb;//读取完成的数据
let rABS = false; //是否将文件读取为二进制字符串
let data = [];  // 转为JSON的最终数据
let xData = {
    data: [],
    type: 'category',
    name: ''
}; //  x轴数值
let yData = []; //  y轴数值
let scatterData = [];
let legend = [];
let rawColor = [];  //  初始配色

function get_obj_first_value(data){
    for (var key in data)
        return +data[key];
}

function get_obj_first_key(data){
    for (var key in data)
        return key;
}

function importExcel(obj) {//导入
    if(!obj.files) {
        return;
    }
    const IMPORTFILE_MAXSIZE = 1*1024;//这里可以自定义控制导入文件大小
    var suffix = obj.files[0].name.split(".")[1]
    if(suffix != 'xls' && suffix !='xlsx'){
        alert('导入的文件格式不正确!')
        return
    }
    if(obj.files[0].size/1024 > IMPORTFILE_MAXSIZE){
        alert('导入的表格文件不能大于1M')
        return
    }
    var f = obj.files[0];
    var reader = new FileReader();
    reader.onload = function(e) {
        var data = e.target.result;
        if(rABS) {
            wb = XLSX.read(btoa(fixdata(data)), {//手动转化
                type: 'base64'
            });
        } else {
            wb = XLSX.read(data, {
                type: 'binary'
            });
        }
        //wb.SheetNames[0]是获取Sheets中第一个Sheet的名字
        //wb.Sheets[Sheet名]获取第一个Sheet的数据
        document.getElementById("demo").innerHTML= JSON.stringify( XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]) );
        data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        showTableData(data);

        xData = {
            data: [],
            type: 'category',
            name: ''
        }; //  x轴数值;
        yData = [];
        // yData初始化
        let len = Object.keys(data[0]).length;
        for (let i = 0; i < len - 1; i++) {
            yData[i] = new Object();
            yData[i].data = new Array();
            yData[i].type = 'line';
        }
        // x & y 数值赋值
        data.forEach(e => {
            xData.data.push(get_obj_first_value(e));
            xData.name = get_obj_first_key(e)
            delete e[get_obj_first_key(e)];
            for (let i = 0; Object.keys(e).length > 0; i++) {
                yData[i].data.push(parseInt(get_obj_first_value(e)));
                yData[i].name = get_obj_first_key(e);
                delete e[get_obj_first_key(e)];
            }
        });
        console.log('xxxxxx', xData.data);
        
        scatterData = [];
        for (let i = 0; i < xData.data.length; i++) {
            scatterData.push([+xData.data[i], +yData[0].data[i]]);
        }
        chartType = 'scatter';
        // 获取y轴属性值
        legend = yData.map(e => e.name);
        $('.chart').removeClass('show');
        $('#' + chartType).addClass('show');
        createChart(chartType);
    };
    if(rABS) {
        reader.readAsArrayBuffer(f);
    } else {
        reader.readAsBinaryString(f);
    }
}

function fixdata(data) { //文件流转BinaryString
    var o = "",
        l = 0,
        w = 10240;
    for(; l < data.byteLength / w; ++l) o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w, l * w + w)));
    o += String.fromCharCode.apply(null, new Uint8Array(data.slice(l * w)));
    return o;
}



// echarts构建
function createChart (type) {

    let option = {
        title: {text: wb.SheetNames[0]},
        xAxis: xData,
        yAxis: {
            type: 'value'
        },
        series: yData,
        tooltip: {},
        legend: {
            data: legend
        }
    }
    if (type === 'line') {
        let lineChart = echarts.init(document.getElementById('line'));
        // 折线图赋值
        lineChart.setOption(option);
        rawColor = lineChart.getOption().color;
    } else if (type === 'bar') {
        let barChart = echarts.init(document.getElementById('bar'));
        let barOption = JSON.parse(JSON.stringify(option));
        barOption.series = changeType(barOption.series, 'bar');
        barChart.setOption(barOption);
        rawColor = barChart.getOption().color;

    } else if (type === 'scatter') {
        // 散点图初始化
        let scatterChart = echarts.init(document.getElementById('scatter'));
        let scatterOption = JSON.parse(JSON.stringify(option));
        scatterOption.series = changeType(scatterOption.series, 'scatter');
        scatterOption.series[0].data = scatterData;
        // 最小值界定
        let yGroup = [], xGroup = [];
        scatterData.forEach(e => {
            xGroup.push(e[0]);
            yGroup.push(e[1]);
        });
        xMin = eval("Math.min(" + xGroup.toString() + ")");
        xMax = eval("Math.max(" + xGroup.toString() + ")");
        yMin = eval("Math.min(" + yGroup.toString() + ")");
        yMax = eval("Math.max(" + yGroup.toString() + ")");
        scatterOption.xAxis = {
            min: Math.floor(xMin - (xMax - xMin) * 0.1)
        };
        scatterOption.yAxis = {
            min: Math.floor(yMin - (yMax - yMin) * 0.1)
        };
        console.log(scatterOption);
        scatterChart.setOption(scatterOption);
        rawColor = scatterChart.getOption().color;
    }
    // rgb颜色转hsl
    rawColor = rawColor.map(e => {
        e = e.replace('#', '');
        return rgbToHsl(e);
    });
    console.log('raw', rawColor);
}

function rgbToHsl(rgb) {
    let r = parseInt(rgb.substring(0, 2), 16) / 255;
    let g = parseInt(rgb.substring(2, 4), 16) / 255;
    let b = parseInt(rgb.substring(4, 6), 16) / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min){
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    h = 360 * (1-h);

    return `hsl(${h.toFixed(2)},${s.toFixed(2)},${l.toFixed(2)})`
}

// 表格信息重现
function showTableData (info) {
    $('#dataTable').empty();
    console.log(info[0])
    // 表头信息初始化
    let headerInfo = '<tr>';
    for (let i in info[0]) {
        headerInfo += '<th>' + i + '</th>'
    }
    $('#dataTable').append(headerInfo + '</tr>');
    let bodyInfo = '';
    info.forEach(e => {
        bodyInfo += '<tr>';
        for (let i in e) {
            bodyInfo += '<td>' + e[i] + '</td>';
        }
        bodyInfo += '</tr>'
        
    });
    $('#dataTable').append(bodyInfo);
}

function changeType(data, type){
    return data.map(e => {
        e.type = type;
        return e;
    });
}

function getData (obj) {
    importExcel(obj);
};

// 切换数据展示类型
$('.btn').click(function (e) { 
  $('.btn').removeClass('active');
  $(this).addClass('active');
  $('.chart').removeClass('show');
  $('#' + $(this).attr('name')).addClass('show');
  createChart($(this).attr('name'));
});

// 大小调整
$('#ex1').slider({
    formatter: function (value) {
        return '大小: ' + value;
    }
}).on('change', function (e) {
    //当值发生改变的时候触发
    let chartInfo = echarts.init(document.getElementById('scatter'));
    let option = chartInfo.getOption();
    console.log(rawColor);
    for (let i = 0; i < option.series.length; i++) {
        option.series[i].symbolSize = +e.value.newValue;
        // option.series[i].color = 
    }
    option.series.forEach(item => {
        item.symbolSize = +e.value.newValue;
        // 颜色改变
        let data = e.itemStyle.color.match(/\d+(.\d+)*/g);
        let s = parseFloat(data[1]) + 3 / item.symbolSize;
        let l = parseFloat(data[2]) + 2 / item.symbolSize;
        item.color = ``
    });
    // option.series[0].symbolSize = +e.value.newValue;
    chartInfo.setOption(option); 
    //获取旧值和新值
    console.info(e.value.oldValue + '--' + e.value.newValue);
});

function colorAdd (oldValue, newValue, type) {
    
}