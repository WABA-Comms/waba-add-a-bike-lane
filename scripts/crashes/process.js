const fs = require('fs');

fs.readFile('./data/Crashes_in_DC.geojson', encoding = 'utf8', (err, data) => {
  if (err) throw err;

  const input = JSON.parse(data);
  const output = {
    type: 'FeatureCollection',
    features: []
  };

  const today = Date.now();

  input.features.forEach((ft) => {
    const timeElapsed = Math.abs(new Date(ft.properties.REPORTDATE).getTime() - today);
    const daysElapsed = Math.ceil(timeElapsed / (1000 * 60 * 60 * 24));

    // filter to only include the past 2 years of crash data
    console.log(ft.properties.REPORTDATE);
    if (daysElapsed < 730) output.features.push(ft);
  });

  console.log(output);

  fs.writeFileSync('./data/crashes.geojson', JSON.stringify(output));
  console.log('Output data written to ./data/crashes.geojson');
});

fs.unlink('./data/Crashes_in_DC.geojson', (err) => {
  if (err) throw err;
});
