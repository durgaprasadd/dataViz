const chartSize = { width: 1400, height: 650 };
const margin = { left: 100, right: 10, top: 10, bottom: 80 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;
const colorScheme = d3.scaleOrdinal(d3.schemeCategory10)

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
        .attr('y', height + margin.bottom - 10)
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
}

const showSlider = (quotes) => {
    const slider = d3
        .sliderBottom()
        .min(0)
        .max(quotes.length - 1)
        .width(600)
        .tickFormat(i => quotes[_.floor(i)].Date.toString().split(" ")[3])
        .ticks(10)
        .fill('#3498db')
        .default([0, quotes.length - 1])
        .on("onchange", ([begin, end]) => {
            const selectedQuotes = quotes.slice(_.floor(begin), _.ceil(end))
            renderSelectedQuotes(selectedQuotes, "Date", "Close")
            d3.select('#sma-period').on('change', updateSmaAndOffset.bind(null, quotes, selectedQuotes));
            d3.select('#offset').on('change', updateSmaAndOffset.bind(null, quotes, selectedQuotes));
        })

    d3.select('#slider-container')
        .attr('width', 700)
        .attr('height', 50)
        .append('g')
        .attr('transform', 'translate(11,8)')
        .call(slider)
}

const renderSelectedQuotes = (quotes, fieldName1, fieldName2) => {
    const svg = d3.select("#chart-area svg");
    const fqDate = _.first(quotes).Date;
    const lqDate = _.last(quotes).Date;
    const maxClose = _.get(_.maxBy(quotes, fieldName2), fieldName2, 0)
    const minClose = _.get(_.minBy(quotes, fieldName2), fieldName2, 0)
    const maxSma = _.get(_.maxBy(quotes, "sma"), "sma", 0);
    const minSma = _.get(_.minBy(quotes, "sma"), "sma", 0);
    const y = d3.scaleLinear()
        .domain([Math.min(minClose, minSma), Math.max(maxClose, maxSma)])
        .range([height, 0]);

    const x = d3.scaleTime()
        .domain([fqDate, lqDate])
        .range([0, width])

    const x_axis = d3.axisBottom(x);
    const y_axis = d3.axisLeft(y).ticks(10);

    svg.select('.y-axis').call(y_axis);
    svg.select('.x-axis').call(x_axis);
    const g = d3.select('.prices')

    const line = d3.line().x(q => x(q[fieldName1])).y(q => y(q[fieldName2]))
    const smaLine = d3.line().x(q => x(q[fieldName1])).y(q => y(q.sma))

    g.select(".close")
        .attr("d", line(quotes))

    g.select(".sma")
        .attr("d", smaLine(quotes.slice(getSmaStartingIndex(quotes))));
}

const updateSmaAndOffset = (totalQuotes, selectedQuotes) => {
    totalQuotes.forEach(quote => delete quote.sma)
    const period = +d3.select('#sma-period').property('value') || 100;
    const offset = +d3.select('#offset').property('value') || 0;
    analyseData(totalQuotes, period, offset);
    renderSelectedQuotes(selectedQuotes, "Date", "Close")
}

const getSmaStartingIndex = (quotes) => {
    let startSma = 0;
    _.some(quotes, (quote, index) => {
        if (quote.sma) {
            startSma = index;
            return true;
        }
        return false
    })
    return startSma;
}

const updateQuotes = (quotes, fieldName1, fieldName2) => {
    const svg = d3.select("#chart-area svg");
    svg.select('.y.axis-label').text(fieldName2);
    const fqDate = _.first(quotes).Date;
    const lqDate = _.last(quotes).Date;
    const maxClose = _.get(_.maxBy(quotes, fieldName2), fieldName2, 0)
    const minClose = _.get(_.minBy(quotes, fieldName2), fieldName2, 0)

    const y = d3.scaleLinear()
        .domain([minClose, maxClose])
        .range([height, 0]);

    const x = d3.scaleTime()
        .domain([fqDate, lqDate])
        .range([0, width])

    const x_axis = d3.axisBottom(x);
    const y_axis = d3.axisLeft(y).ticks(10);

    svg.select('.y-axis').call(y_axis);
    svg.select('.x-axis').call(x_axis);
    const g = d3.select('.prices')

    const line = d3.line().x(q => x(q[fieldName1])).y(q => y(q[fieldName2]))
    const smaLine = d3.line().x(q => x(q[fieldName1])).y(q => y(q.sma))

    g.append("path")
        .attr("class", "close")
        .attr("d", line(quotes))

    g.append("path")
        .attr("class", "sma")
        .attr("d", smaLine(quotes.slice(getSmaStartingIndex(quotes))));
}

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

const applyStrategy = (quotes, period) => {
    let boughtTimes = 0;
    let soldTimes = 0;
    let investment = 100;
    let stocks = 0;
    let bought = false;
    for (let i = period - 1; i < quotes.length; i++) {
        let { Close, sma } = quotes[i];
        if (!bought && Close > sma) {
            bought = true;
            boughtTimes++;
            stocks = investment / Close;
        }
        if (bought && (Close < sma || i == quotes.length - 1)) {
            soldTimes++;
            bought = false;
            investment = stocks * Close;
        }
    }
    return { boughtTimes, soldTimes, investment, bought, period }
}

const analyseData = (quotes, period, offset = 0) => {
    for (let i = period; i < quotes.length + 1 - offset; i++) {
        let sum = quotes.slice(i - period, i).reduce((a, b) => a + b.Close, 0);
        const sma = _.round(sum / period);
        quotes[i - 1 + offset].sma = sma
    }
}

const startVisualization = (quotes) => {
    analyseData(quotes, 100);
    console.log(applyStrategy(quotes, 100));
    drawChart();
    updateQuotes(quotes, "Date", "Close");
    showSlider(quotes);

    d3.select('#sma-period')
        .attr('max', quotes.length)
        .on('change', updateSmaAndOffset.bind(null, quotes, quotes))
    d3.select('#offset')
        .attr('max', quotes.length)
        .on('change', updateSmaAndOffset.bind(null, quotes, quotes))

}

const main = () => {
    d3.csv('data/NSEI.csv', parseQuotes).then(startVisualization);
}

window.onload = main;