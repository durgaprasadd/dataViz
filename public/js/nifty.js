const chartSize = { width: 1400, height: 650 };
const margin = { left: 100, right: 10, top: 10, bottom: 80 };
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

const getLocaleDate = (TimeStamp) => new Date(TimeStamp).toLocaleDateString('en-GB');
const getRange = (begin, end) => getLocaleDate(begin) + "  -  " + getLocaleDate(end);

const getStartIndex = (quotes, begin) => {
    for (i = 0; i < quotes.length; i++) {
        if (quotes[i].Date.getTime() >= begin) {
            return i;
        }
    }
    return 0;
}

const getEndIndex = (quotes, end) => {
    for (i = quotes.length - 1; i >= 0; i--) {
        if (quotes[i].Date.getTime() <= end) {
            return i;
        }
    }
    return quotes.length - 1;
}

const getQuotesInRange = (quotes, begin, end) => {
    const startIndex = getStartIndex(quotes, begin);
    const endIndex = getEndIndex(quotes, end);
    console.log(startIndex, endIndex)
    return quotes.slice(startIndex, endIndex + 1);
}

const showSlider = (quotes) => {
    const fqDate = _.first(quotes).Date;
    const lqDate = _.last(quotes).Date;
    console.log(fqDate.getTime())
    var slider = createD3RangeSlider(fqDate.getTime(), lqDate.getTime(), "#slider-container");
    slider.range(fqDate.getTime(), lqDate.getTime())
    d3.select("#range-label").text(getRange(fqDate, lqDate));
    slider.onChange(function ({ begin, end }) {
        d3.select("#range-label").text(getRange(begin, end));
        const selectedQuotes = getQuotesInRange(quotes, begin, end);
        renderSelectedQuotes(selectedQuotes, "Date", "Close");
    });

}

const renderSelectedQuotes = (quotes, fieldName1, fieldName2) => {
    console.log(quotes);
    const svg = d3.select("#chart-area svg");
    svg.select('.y.axis-label').text(fieldName2);
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
    const y_axis = d3.axisLeft(y).ticks(10).tickFormat(formats[fieldName2]);

    svg.select('.y-axis').call(y_axis);
    svg.select('.x-axis').call(x_axis);
    const g = d3.select('.prices')

    const line = d3.line().x(q => x(q[fieldName1])).y(q => y(q[fieldName2]))
    const smaLine = d3.line().x(q => x(q[fieldName1])).y(q => y(q.sma))

    g.select(".close")
        .attr("d", line(quotes))
    let startSma = 0;
    _.some(quotes, (quote, index) => { return quote.sma && (startSma = index) })
    console.log(startSma)
    g.select(".sma")
        .attr("d", smaLine(quotes.slice(startSma)))
}






const updateQuotes = (quotes, fieldName1, fieldName2) => {
    // showData(quotes, fieldName1, fieldName2)
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
    const y_axis = d3.axisLeft(y).ticks(10).tickFormat(formats[fieldName2]);

    svg.select('.y-axis').call(y_axis);
    svg.select('.x-axis').call(x_axis);
    const g = d3.select('.prices')

    const line = d3.line().x(q => x(q[fieldName1])).y(q => y(q[fieldName2]))
    const smaLine = d3.line().x(q => x(q[fieldName1])).y(q => y(q.sma))

    g.append("path")
        .attr("class", "close")
        .attr("d", line(quotes))

    let startSma = 0;
    _.some(quotes, (quote, index) => { return quote.sma && (startSma = index) })
    g.append("path")
        .attr("class", "sma")
        .attr("d", smaLine(quotes.slice(startSma)))
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

const analyseData = (quotes, period) => {
    for (let i = period; i < quotes.length + 1; i++) {
        let sum = quotes.slice(i - period, i).reduce((a, b) => a + b.Close, 0);
        const sma = _.round(sum / 100);
        quotes[i - 1].sma = sma
    }
}

const analyseStrategy = (quotes) => {
    const analysis = []
    for (let i = 1; i < quotes.length; i++) {
        let duplicate = quotes.slice();
        analyseData(duplicate, i);
        analysis.push(applyStrategy(duplicate, i));
    }
    console.log(_.maxBy(analysis, "investment"))
}

const startVisualization = (quotes) => {
    // let duplicate = quotes.slice();
    // analyseStrategy(duplicate);
    analyseData(quotes, 100);
    console.log(applyStrategy(quotes, 100));
    drawChart();
    updateQuotes(quotes, "Date", "Close");
    showSlider(quotes);

}

const main = () => {
    d3.csv('data/NSEI.csv', parseQuotes).then(startVisualization);
}

window.onload = main;