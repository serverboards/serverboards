var Plotly = require('plotly.js/lib/core');

// Load in the trace types you need e.g. pie, and choropleth
Plotly.register([
    require('plotly.js/lib/bar'),
//    require('plotly.js/lib/lines')
]);

export default Plotly
