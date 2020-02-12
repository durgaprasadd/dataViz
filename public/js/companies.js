const showData = (companies) => {
    const toLine = b => `<strong>${b.Name}</strong> <i>${b.CMP}</i>`;
    document.querySelector('#chart-data').innerHTML = companies.map(toLine).join('<hr/>');
  }
  const drawChart = (companies) => {
    const chartSize = {
      width: 800,
      height: 600
    };
  
    const margin = {
      left: 100,
      right: 10,
      top: 10,
      bottom: 150
    };
  
    const width = chartSize.width - margin.left - margin.right;
    const height = chartSize.height - margin.top - margin.bottom;
  
    const c = d3.scaleOrdinal(d3.schemeCategory10)
    const svg = d3.select('#chart-area')
      .append('svg')
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
  
    const y_axis = d3.axisLeft(y).ticks(5);
    const x_axis = d3.axisBottom(x);
  
    g.append('g').attr('class', 'y-axis').call(y_axis);
    g.append('g').attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(x_axis);
  
  
    g.selectAll('.x-axis text').attr('x', -5).attr('y', 10).attr('transform', 'rotate(-40)')
      .attr('text-anchor', 'end');
  
    const rects = g.selectAll('rect').data(companies);
    const newRects = rects.enter();
    newRects.append('rect')
      .attr('x', c=> x(c.Name))
      .attr('y', c => y(c.CMP))
      .attr('width', x.bandwidth)
      .attr('height', c => y(0) - y(c.CMP))
      .attr('fill', b => c(b.Name));
  }


  const parseCompanies = (company) => {
      _.forEach(company,(value,key) => {
          if(!isNaN(value)) {
              company[key] = + value
          }
      })
      return company;
  }
  const drawCompanies = (companies) => {
    showData(companies);
    drawChart(companies);
  }
  const main = () => {
    d3.csv('data/companies.csv',parseCompanies).then(drawCompanies);
  }
  window.onload = main;