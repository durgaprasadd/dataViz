const chartSize = { width: 800, height: 600 };
const margin = { left: 100, right: 10, top: 10, bottom: 150 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const showData = (companies, fieldName) => {
    const toLine = company => `<strong>${company.Name}</strong> <i>${company[fieldName]}</i>`;
    document.querySelector('#chart-data').innerHTML = companies.map(toLine).join('<hr/>');
}

const drawChart = (companies) => {

    const colorScheme = d3.scaleOrdinal(d3.schemeCategory10)
    const svg = d3.select('#chart-area svg')
        .attr('height', chartSize.height)
        .attr('width', chartSize.width);

    const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

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
        .text("CMP");


    const y = d3.scaleLinear()
        .domain([0, _.maxBy(companies, 'CMP').CMP])
        .range([height, 0]);

    const x = d3.scaleBand()
        .domain(_.map(companies, 'Name'))
        .range([0, width])
        .padding(0.3);

    const y_axis = d3.axisLeft(y).ticks(10);
    const x_axis = d3.axisBottom(x);

    g.append('g').attr('class', 'y-axis').call(y_axis);
    g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(x_axis);


    g.selectAll('.x-axis text')
        .attr('x', -5)
        .attr('y', 10)
        .attr('transform', 'rotate(-40)')
        .attr('text-anchor', 'end');

    const rects = g.selectAll('rect').data(companies);
    const newRects = rects.enter();
    newRects.append('rect')
        .attr('x', company => x(company.Name))
        .attr('y', company => y(company.CMP))
        .attr('width', x.bandwidth)
        .attr('height', company => y(0) - y(company.CMP))
        .attr('fill', company => colorScheme(company.Name));
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

    svg.selectAll('rect')
        .data(companies, c => c.Name)
        .exit()
        .remove()

    svg.selectAll('rect')
        .data(companies, c => c.Name)
        .transition()
        .duration(1000)
        .ease(d3.easeLinear)
        .attr('y', c => y(c[fieldName]))
        .attr('x', c => x(c.Name))
        .attr('width', x.bandwidth)
        .attr('height', c => y(0) - y(c[fieldName]))
}

const parseCompanies = (company) => {
    _.forEach(company, (value, key) => {
        if (!isNaN(value)) {
            company[key] = + value
        }
    })
    return company;
}

const drawCompanies = (companies) => {
    showData(companies, 'CMP');
    drawChart(companies);
}

const main = () => {
    d3.csv('data/companies.csv', parseCompanies).then((companies) => {

        drawCompanies(companies);
        
        const fields = "CMP,PE,MarketCap,DivYld,QNetProfit,QSales,ROCE".split(',');
        let step = 1;

        setInterval(() => { 
            let field = fields[step++ % fields.length];
             updateCompanies(companies, field); 
             showData(companies, field) }, 1500)

        setInterval(() => companies.shift(), 5000)
    });
}

window.onload = main;