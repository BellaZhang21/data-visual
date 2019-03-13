let wb;//读取完成的数据
let rABS = false; //是否将文件读取为二进制字符串
let data = [];  // 转为JSON的最终数据
let xData = {
    data: [],
    type: 'category',
    name: ''
}; //  x轴数值
let yData = []; //  y轴数值
let legend = [];

function get_obj_first_value(data){
    for (var key in data)
        return data[key];
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
        console.log(data[0]);
        showTableData(data);

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

        // 获取y轴属性值
        legend = yData.map(e => e.name);
        console.log(xData, yData, legend);

        createChart();
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
function createChart () {
    let lineChart = echarts.init(document.getElementById('line'));

    let lineOption = {
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
    };
    // 折线图赋值
    lineChart.setOption(lineOption);

    // 柱状图初始化
    let barChart = echarts.init(document.getElementById('bar'));
    let barOption = JSON.parse(JSON.stringify(lineOption));
    barOption.series = changeType(barOption.series, 'bar');
    barChart.setOption(barOption);

    // 散点图初始化
    let scatterChart = echarts.init(document.getElementById('scatter'));
    let scatterOption = JSON.parse(JSON.stringify(lineOption));
    scatterOption.series = changeType(scatterOption.series, 'scatter');
    scatterChart.setOption(scatterOption);

}

function showTableData (info) {
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

