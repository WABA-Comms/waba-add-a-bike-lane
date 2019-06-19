const fs = require('fs');

fs.readFile('./data/Crashes_in_DC.geojson', encoding = 'utf8', (err, data) => {
  if (err) throw err;

  const output = JSON.parse(data);

  const today = Date.now();

  output.features.forEach((ft) => {
    const timeElapsed = Math.abs(new Date(ft.properties.REPORTDATE).getTime() - today);
    const daysElapsed = Math.ceil(timeElapsed / (1000 * 60 * 60 * 24));

    // filter to only include the past 2 years of crash data
    if (daysElapsed < 730) {
      Object.keys(ft.properties).forEach((key) => {
        // filter to only inculde bicycle and pedestrian incidents
        if (key !== 'TOTAL_BICY' && key !== 'TOTAL_PEDE') delete ft.properties[key];
      });
    }
  });

  fs.writeFileSync('./data/crashes.geojson', JSON.stringify(output));
  console.log('Output data written to ./data/crashes.geojson');
});
