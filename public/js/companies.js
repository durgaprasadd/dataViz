const chartSize = { width: 800, height: 600 };
const margin = { left: 100, right: 10, top: 10, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;
const colorScheme = d3.scaleOrdinal(d3.schemeCategory10)

const showData = (companies, fieldName) => {
    const toLine = company => `<strong>${company.Name}</strong> <i>${company[fieldName]}</i>`;
    document.querySelector('#chart-data').innerHTML = companies.map(toLine).join('<hr/>');
}

const drawChart = () => {
    const svg = d3.select('#chart-area svg')
        .attr('height', chartSize.height)
        .attr('width', chartSize.width);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)
        .attr('class', 'companies');

    g.append("text")
        .attr('class', "x axis-label")
        .attr('x', width / 2)
        .attr('y', height + 140)
        .text("companies");

    g.append("text")
        .attr('class', 'y axis-label')
        .attr('transform', "rotate(-90)")
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

const updateCompanies = (companies, fieldName) => {
    showData(companies, fieldName)
    const svg = d3.select("#chart-area svg");
    svg.select('.y.axis-label').text(fieldName);

    const y = d3.scaleLinear()
        .domain([0, _.get(_.maxBy(companies, fieldName), fieldName, 0)])
        .range([height, 0]);

    const x = d3.scaleBand()
        .domain(_.map(companies, 'Name'))
        .range([0, width])
        .padding(0.3);

    const x_axis = d3.axisBottom(x);
    const y_axis = d3.axisLeft(y).ticks(10).tickFormat(formats[fieldName]);

    svg.select('.y-axis').call(y_axis);
    svg.select('.x-axis').call(x_axis);

    const companiesG = svg.select('.companies');
    const rects = companiesG.selectAll('rect').data(companies, c => c.Name);

    const t = d3.transition().duration(1000).ease(d3.easeLinear);
    rects
        .exit()
        .remove()

    rects
        .enter()
        .append('rect')
        .attr('x', c => x(c.Name))
        .attr('y', y(0))
        .attr('width', x.bandwidth)
        .merge(rects)
        .transition(t)
        .attr('y', c => y(c[fieldName]))
        .attr('x', c => x(c.Name))
        .attr('width', x.bandwidth)
        .attr('height', c => y(0) - y(c[fieldName]))
        .attr('fill', company => colorScheme(company.Name));

}

const parseCompanies = (company) => {
    _.forEach(company, (value, key) => {
        if (!isNaN(value)) {
            company[key] = + value
        }
    })
    return company;
}

const frequentlyMoveCompanies = (src, dest) => {
    setInterval(() => {
        const c = src.shift();
        if (c) dest.push(c);
        else[src, dest] = [dest, src];

    }, 1500);
}

const startVisualization = (companies) => {
    const fields = _.keys(companies[0]).slice(1)
    let step = 1;

    drawChart();
    frequentlyMoveCompanies(companies, []);
    updateCompanies(companies, fields[0]);

    setInterval(() => {
        let field = fields[step++ % fields.length];
        updateCompanies(companies, field);
    }, 1000);

}

const main = () => {
    d3.csv('data/companies.csv', parseCompanies).then(startVisualization);
}

window.onload = main;