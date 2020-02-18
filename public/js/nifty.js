const chartSize = { width: 800, height: 600 };
const margin = { left: 100, right: 10, top: 10, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;
const colorScheme = d3.scaleOrdinal(d3.schemeCategory10)

const showData = (quotes, fieldName1, fieldName2) => {
    const toLine = quote => `<strong>${quote[fieldName1]}</strong> <i>${quote[fieldName2]}</i>`;
    document.querySelector('#chart-data').innerHTML = quotes.map(toLine).join('<hr/>');
}

const drawChart = () => {
    const svg = d3.select('#chart-area svg')
        .attr('height', chartSize.height)
        .attr('width', chartSize.width);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('class', 'prices');

    g.append("text")
        .attr('class', "x axis-label")
        .attr('x', width / 2)
        .attr('y', height + 140)
        .text("Time");

    g.append("text")
        .attr('class', 'y axis-label')
        .attr('x', -height / 2)
        .attr('y', -60)

    g.append('g')
        .attr('class', 'y-axis')

    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)


    g.selectAll('.x-axis text')
        .attr('x', -5)
        .attr('y', 10)
        .attr('transform', 'rotate(-40)')
        .attr('text-anchor', 'end');
}

const percentageFormat = d => `${d}%`
const kCroreFormat = d => `${d / 1000}k Cr ₹`

const formats = {
    MarketCap: kCroreFormat,
    QSales: kCroreFormat,
    QNetProfit: kCroreFormat,
    DivYld: percentageFormat,
    ROCE: percentageFormat
}

const updateQuotes = (quotes, fieldName1, fieldName2) => {
    showData(quotes, fieldName1, fieldName2)
    const svg = d3.select("#chart-area svg");
    svg.select('.y.axis-label').text(fieldName2);

    const fq = _.first(quotes);
    const lq = _.last(quotes);

    const maxClose = _.get(_.maxBy(quotes, fieldName2), fieldName2, 0)
    const minClose = _.get(_.minBy(quotes, fieldName2), fieldName2, 0)

    const y = d3.scaleLinear()
        .domain([minClose, maxClose])
        .range([height, 0]);

    const x = d3.scaleTime()
        .domain([new Date(fq[fieldName1]), new Date(lq[fieldName1])])
        .range([0, width])

    const x_axis = d3.axisBottom(x);
    const y_axis = d3.axisLeft(y).ticks(10).tickFormat(formats[fieldName2]);

    svg.select('.y-axis').call(y_axis);
    svg.select('.x-axis').call(x_axis);
    const g = d3.select('.prices')

    const line = d3.line().x(q => x(new Date(q[fieldName1]))).y(q => y(q[fieldName2]))

    g.append("path")
        .attr("class", "close")
        .attr("d", line(quotes))
}

const parseQuotes = (quote) => {
    _.forEach(quote, (value, key) => {
        if (!isNaN(value)) {
            quote[key] = + value
        }
    })
    return quote;
}

const startVisualization = (quotes) => {
    drawChart();
    updateQuotes(quotes, "Date", "Close");
}

const main = () => {
    d3.csv('data/NSEI.csv', parseQuotes).then(startVisualization);
}

window.onload = main;