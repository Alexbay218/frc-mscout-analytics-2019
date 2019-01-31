const Chart = require('chart.js');

$(document).ready(() => {$('#display').transition()});

var ctx = document.getElementById("totalMatches").getContext('2d');
data = {
    datasets: [{
        data: [10, 20, 30],
        backgroundColor: [
            "#FF0000",
            "#FFFF00",
            "#0000FF"
        ]
    }],

    // These labels appear in the legend and in the tooltips when hovering different arcs
    labels: [
        'Red',
        'Yellow',
        'Blue'
    ]
};
var tMChart = new Chart(ctx,{
    type: 'doughnut',
    data: data
});
