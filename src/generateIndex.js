const fs = require('fs');
const vega = require('vega');
const vegaLite = require('vega-lite');
let data = require('../raw_data.json');
const transform = require('./transform');
const template = fs.readFileSync('./template/template.html', 'utf8');

const toSVG = async (specFile, data, template, key) => {
  const spec = JSON.parse(fs.readFileSync(`./spec/${specFile}.json`, 'utf8'));
  spec.data.values = data;
  delete spec.data.url;
  console.log('Compiling vega lite specs to vega...');
  const compiledSpec = vegaLite.compile(spec);
  console.log('Parsing Vega spec...');
  const parsedSpec = vega.parse(compiledSpec.spec);
  console.log('Creating Vega view...');
  const view = new vega.View(parsedSpec, { renderer: 'none' });
  console.log('Rendering svg...');
  const svg = await view.toSVG();
  return template.replace(key, svg);
};

fs.writeFileSync(
  '../dummy.json',
  JSON.stringify(transform.getLatestPushSummary(data)),
  'utf8'
);
toSVG(
  'timelines',
  transform.getMetaSummaryPerPush(data),
  template,
  '__TIMELINE__'
)
  .then(newTemplate => {
    return toSVG(
      'latestTests',
      transform.getLatestPushSummary(data),
      newTemplate,
      '__LATEST_TESTS__'
    );
  })
  .then(newTemplate => {
    return toSVG(
      'passPercent',
      transform.getPassPercent(data),
      newTemplate,
      '__PASS_PERCENT__'
    );
  })
  .then(newTemplate =>
    newTemplate.replace('__LAST_GENERATED_AT__', new Date().toLocaleString())
  )
  .then(newTemplate => {
    if (!fs.existsSync('./public')) fs.mkdirSync('./public');
    fs.writeFileSync('./public/index.html', newTemplate, 'utf8');
  });
