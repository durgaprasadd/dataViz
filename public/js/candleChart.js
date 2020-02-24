const chartSize = { width: 1400, height: 650 };
const margin = { left: 100, right: 10, top: 10, bottom: 80 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const parseQuotes = (quote) => {
    _.forEach(quote, (value, key) => {
        if (key == 'Date') {
            quote[key] = new window.Date(value)
        }
        else if (!isNaN(value)) {
            quote[key] = + value
        }
    })
    return quote;
}

const drawChart = (quotes) => {
    const svg = d3.select('#chart-area svg')
        .attr('height', chartSize.height)
        .attr('width', chartSize.width);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('class', 'prices');

    g.append("text")
        .attr('class', "x axis-label")
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .text("Time");

    g.append("text")
        .attr('class', 'y axis-label')
        .attr('x', -height / 2)
        .attr('y', -60)
        .text("Close");

    const x = d3.scaleBand()
        .domain(_.range(0, quotes.length))
        .range([0, width])
        .padding(0.3);

    const minLow = _.minBy(quotes, "Low").Low;
    const maxHigh = _.maxBy(quotes, "High").High;

    y = d3.scaleLinear()
        .domain([minLow, maxHigh])
        .range([height, 0]);

    const x_axis = d3.axisBottom(x)
        .tickFormat(index => quotes[index].Date.toLocaleDateString('en-GB'))
        .tickSize(-height);
    const y_axis = d3.axisLeft(y).tickSize(-width);

    g.append('g')
        .attr('class', 'y-axis')
        .call(y_axis);

    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(x_axis);

    const candle = g.selectAll('.candle')
        .data(quotes)
        .enter()
        .append('g')
        .attr('class', 'candle');

    candle.append('line')
        .attr('class', 'wick')
        .attr('x1', (q, i) => x(i) + x.bandwidth() / 2)
        .attr('x2', (q, i) => x(i) + x.bandwidth() / 2)
        .attr('y1', q => y(q.High))
        .attr('y2', q => y(q.Low));

    candle.append('rect')
        .attr('class', (q) => q.Close < q.Open ? "down" : "up")
        .attr('x', (q, i) => x(i))
        .attr('y', (q, i) => y(Math.max(q.Close,q.Open)))
        .attr('width', x.bandwidth)
        .attr('height', (q, i) => Math.abs(y(q.Close) - y(q.Open)));

}

const startVisualization = (quotes) => {
    drawChart(quotes.slice(0,10));
}

const main = () => {
    d3.csv('data/NSEI.csv', parseQuotes).then(startVisualization);
}

window.onload = main;