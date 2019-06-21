mapboxgl.accessToken = 'pk.eyJ1IjoiY29saW53YWJhIiwiYSI6ImNqeDNvaDlidDAweHEzemxseXl3NXV3Y2cifQ.VOXbpkao083c20VDcT6dhA';

var collisions, bufferedCorridor;
var emptyGeojson = turf.featureCollection([]);

var map = new mapboxgl.Map({
  container: 'map',
  style: './add-bike-lane-style.json',
  center: [-77.007945, 38.896870],
  zoom: 12
});

// gl-draw setup
// which includes style definitions for the drawn line
// that represents the proposed bike lane
var draw = new MapboxDraw({
 displayControlsDefault: false,
 styles: [
   {
     "id": "gl-draw-line-active",
     "type": "line",
     "filter": ["all", ["==", "$type", "LineString"], ["==", "active", "true"]],
     "layout": { "line-join": "round", "line-cap": "round" },
     "paint": {
       "line-color": "hsl(24, 85%, 50%)",
       "line-width": { "type": "exponential", "base": 1.5, "stops": [[12, 1],[18, 4]] }
     }
  },
  {
     "id": "gl-draw-line-static",
     "type": "line",
     "filter": ["all", ["==", "$type", "LineString"], ["==", "active", "false"]],
     "layout": { "line-join": "round", "line-cap": "round" },
     "paint": {
       "line-color": "hsl(24, 85%, 50%)",
       "line-width": { "type": "exponential", "base": 1.5, "stops": [[12, 1],[18, 4]] }
     }
  },
  {
    "id": "gl-draw-line-vertex-halo-active",
    "type": "circle",
    "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
    "paint": {
      "circle-radius": 6,
      "circle-color": "#fff"
    }
  },
  {
    "id": "gl-draw-line-vertex-active",
    "type": "circle",
    "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
    "paint": {
      "circle-radius": 4,
      "circle-color": "hsl(24, 85%, 50%)",
    }
  }
 ]});
map.addControl(draw);

// Event handlers for the 'Add a lane'
// and 'Clear lanes' buttons
d3.select('#add')
 .on('click', function(){
  draw.changeMode('draw_line_string')
 })

d3.select('#clear')
 .on('click', function(){
  draw.deleteAll();
  map.getSource('collisions')
   .setData(emptyGeojson);
  map.getSource('buffer')
   .setData(emptyGeojson);
  document.getElementById('corridor-info').style.display = 'none';
 })


 map.on('load', function() {
 Promise.all([
   d3.json('scripts/crashes/collisions.geojson'),
   //d3.json('scripts/moving-violations/moving-violations.geojson')
   d3.json('scripts/census/data/census.geojson')

 ]).then(function(files) {
  files[0].features = files[0].features.filter(function(ft){return typeof ft.geometry.coordinates[0] === 'number'})
  collisions = files[0];
  //files[1].features = files[1].features.filter(function(ft){return typeof ft.geometry.coordinates[0] === 'number'})
  //speeding = files[1];
  //files[1].features = files[1].features.filter(function(ft){return typeof ft.geometry.coordinates[0] === 'number'})
  census = files[1];
  console.log(census);

  // corridorInfo defines the data about a corridor
  // that will display once a bike lane has been added,
  // and defines how it is displayed.
  // `text`, `secondaryText`, and `attribution` values
  // will display as text in the app.
  corridorInfo = [
   {
    id: 'crashes-total',
    text: 'Total crashes',
      geomType: 'point',
    data: collisions,
    attribution: 'Total number of crashes along this corridor in the last 2 years. Data sourced from Open Data DC, <i>Crashes in DC</i> dataset. Last updated 5/28/2019.'
   },
   {
    id: 'crashes-cyclists',
    text: 'Bike-related crashes',
     geomType: 'point',
    data: turf.featureCollection(collisions.features.filter(function(ft){
     return ft.properties.TOTAL_BICYCLES > 0
   })),
   attribution: 'Number of bike-related crashes along this corridor in the last 2 years. Data sourced from Open Data DC, <i>Crashes in DC</i> dataset. Last updated 5/28/2019.'
   },
   {
    id: 'crashes-pedestrians',
    text: 'Pedestrian-related crashes',
      geomType: 'point',
    data: turf.featureCollection(collisions.features.filter(function(ft){
     return ft.properties.TOTAL_PEDESTRIANS > 0
   })),
    attribution: 'Number of pedestrian-related crashes along this corridor in the last 2 years. Data sourced from Open Data DC, <i>Crashes in DC</i> dataset. Last updated 5/28/2019.'
   },
   {
     id: 'speeding-violations',
     text: 'Speeding violations',
     geomType: 'point',
     data: turf.featureCollection(map.querySourceFeatures('composite', {
      // Currently only Dec 2018 data
      sourceLayer: 'moving-violations-dec-2018-re-7lav76',
      filter: ['in', 'VIOLATIONCODE', "T118", "T119", "T120", "T121", "T122"]
    })),
    /*data: turf.featureCollection(speeding.features.filter(function(ft){
     return (
       ft.properties.VIOLATIONCODE == 'T118' ||
       ft.properties.VIOLATIONCODE == 'T119' ||
       ft.properties.VIOLATIONCODE == 'T120' ||
       ft.properties.VIOLATIONCODE == 'T121' ||
       ft.properties.VIOLATIONCODE == 'T122' ||
    )
  })),*/
    attribution: 'Number of speeding violations along this corridor in the last 2 years. Data sourced from Open Data DC, <i>Moving Violations Issued in *</i> datasets. Last updated 5/1/2019.'
    },
    {
     id: 'population',
     text: 'Population',
     geomType: 'polygon',
     /*data: turf.featureCollection(map.querySourceFeatures('composite', {
      sourceLayer: 'combined_features-7kmirr'
    })),*/
     data: census,
     dataFields: ['population_total'],
     attribution: 'Population living in a census block that intersects this corridor. Data sourced from United States Census Bureau.'
    },
    {
     id: 'modeshare',
     text: 'Modeshare',
     secondaryText: [
      'Cycling',
      'Walking',
      'Driving',
      'Motorcycle',
      'Public trans.',
      'Taxi',
      'Other'
     ],
     geomType: 'polygon',
     /*data: turf.featureCollection(map.querySourceFeatures('composite', {
      sourceLayer: 'combined_features-7kmirr',
    })),*/
     data: census,
     dataFields: [
      'transport_bicycle',
      'transport_walked',
      'transport_car_truck_or_van',
      'transport_motorcycle',
      'transport_public_transportation_excluding_taxicab',
      'transport_taxicab',
      'transport_other_means'
      ],
     total: 'transport_total',
     attribution: 'Breakdown of population by mode of transportation used to travel to work. Data sourced from United States Census Bureau.'
    },
    {
     id: 'income',
     text: 'Income',
     secondaryText: [
      '<10k',
      '10k–15k',
      '15k–20k',
      '20k–25k',
      '25k–30k',
      '30k–35k',
      '35k–40k',
      '40k–45k',
      '45k–50k',
      '50k–60k',
      '60k–75k',
      '75k–100k',
      '100k–125k',
      '125k–150k',
      '150k–200k',
      '>200k'
     ],
     geomType: 'polygon',
     /*data: turf.featureCollection(map.querySourceFeatures('composite', {
      sourceLayer: 'combined_features-7kmirr',
    })),*/
     data: census,
     dataFields: [
      'income_less_than_10_000',
      'income_10_000_to_14_999',
      'income_15_000_to_19_999',
      'income_20_000_to_24_999',
      'income_25_000_to_29_999',
      'income_30_000_to_34_999',
      'income_35_000_to_39_999',
      'income_40_000_to_44_999',
      'income_45_000_to_49_999',
      'income_50_000_to_59_999',
      'income_60_000_to_74_999',
      'income_75_000_to_99_999',
      'income_100_000_to_124_999',
      'income_125_000_to_149_999',
      'income_150_000_to_199_999',
      'income_200_000_or_more'
      ],
     total: 'income_total',
     attribution: 'Breakdown of population by household income. Data sourced from United States Census Bureau.'
    }
  ];

  // At runtime, add additional features to the map that depend on
  // data contained in this project:
  // - existing bike lane and trails
  // - visualization of crashes along corridor of proposed bike lane
  // - visualization of buffer around proposed bike lane
  map
  .addSource(
    'bike-lanes',
    {
      'type': 'geojson',
      'data': './scripts/lanes/data/Bicycle_Lanes.geojson'
    }
  )
  .addSource(
    'bike-trails',
    {
      'type': 'geojson',
      'data': './scripts/lanes/data/Bike_Trails.geojson'
    }
  )
  // Add bike trails layer directly before oneway layer in map style
  .addLayer({
    'id': 'bike-trails',
    'type': 'line',
    'source': 'bike-trails',
    'layout': {},
    'paint': {
      'line-color': 'hsl(110, 45%, 40%)',
      'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 1, 18, 4],
      'line-dasharray': [3, 1]
    }
  }, 'oneway')
  // Add bike lanes layer directly before oneway layer in map style
  .addLayer({
    'id': 'bike-lanes-dedicated',
    'type': 'line',
    'source': 'bike-lanes',
    'filter': [
      'in',
      'FACILITY',
      'Climbing Lane',
      'Contraflow Bike Lane',
      'Cycle Track',
      'Existing Bike Lane'
    ],
    'layout': {'line-join': 'round', 'line-cap': 'round'},
    'paint': {
      'line-color': 'hsl(204, 70%, 55%)',
      'line-width': [
        'interpolate',
        ['exponential', 1.5],
        ['zoom'],
        12,
        ['match', ['get', 'FACILITY'], 'Cycle Track', 2, 1],
        18,
        ['match', ['get', 'FACILITY'], 'Cycle Track', 24, 4]
      ]
    }
  }, 'oneway')
  // Add contraflow label layer directly before road label layer in map style
  .addLayer({
    'id': 'bike-lanes-contraflow-label',
    'type': 'symbol',
    'metadata': {},
    'source': 'bike-lanes',
    'filter': ['==', 'FACILITY', 'Contraflow Bike Lane'],
    'layout': {
        'text-field': 'CONTRAFLOW',
        'text-font': [
            'DIN Offc Pro Medium',
            'Arial Unicode MS Regular'
        ],
        'text-size': 10,
        'symbol-spacing': 100,
        'symbol-placement': 'line'
    },
    'paint': {
        'text-color': 'hsl(204, 70%, 45%)',
        'text-halo-width': 1.5,
        'text-halo-color': 'hsl(0, 0%, 100%)'
    }
  }, 'road-label')
  // Add bike trail labels layer directly before settlement subdivision label layer in map style
  .addLayer({
    'id': 'bike-trails-label',
    'type': 'symbol',
    'source': 'bike-trails',
    'layout': {
      'text-field': ['get', 'NAME'],
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        10,
        18,
        16
      ],
      'text-offset': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12,
        ['literal', [0, 0.55]],
        18,
        ['literal', [0, 0.625]]
      ],
      'text-max-angle': 30,
      'text-font': ['DIN Offc Pro Regular', 'Arial Unicode MS Regular'],
      'symbol-placement': 'line',
      'text-padding': 6,
      'text-rotation-alignment': 'map',
      'text-pitch-alignment': 'viewport',
      'text-letter-spacing': 0.01
    },
    'paint': {
      'text-color': 'hsl(0, 0%, 30%)',
      'text-halo-width': 1,
      'text-halo-color': 'hsl(0, 0%, 100%)',
      'text-halo-blur': 0.5
    }
  }, 'settlement-subdivision-label')
  // Add buffer layer after all other layers
  .addLayer({
   'id':'buffer',
   'type':'fill',
   'source': {
    'type': 'geojson',
    'data': emptyGeojson
   },
   'paint':{
    'fill-opacity': 0.2,
    'fill-color': 'hsl(24, 100%, 70%)'
   }
  })
  .addLayer({
   'id':'collisions',
   'type':'circle',
   'source': {
    'type': 'geojson',
    'data': emptyGeojson
   },
   'paint':{
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 2, 18, 4],
      'circle-opacity': 0.25
   }
  })

  // Populate map with preselected line (proposed bike lane)
  // if encoded in URL hash
  var hashedGeometry = decodeHash();
  if (hashedGeometry) {
   draw.add(hashedGeometry);
   updateCorridor()
  }

  map.on('draw.create', updateCorridor);
  map.on('draw.delete', updateCorridor);
  map.on('draw.update', updateCorridor);

  function updateCorridor(e) {
      d3.selectAll('#corridor-info *')
        .remove();
   corridor = turf.truncate(draw.getAll());
   //console.log(corridor);

   encodeHash();
   // Currently, this allows you to draw multiple unconnected lines as a "corridor"
   bufferedCorridor = turf.buffer(corridor, 20, {units: 'meters'});
   drawBuffer(bufferedCorridor)
   drawCollisions(turf.pointsWithinPolygon(collisions, bufferedCorridor));

   map.fitBounds(turf.bbox(bufferedCorridor), {padding:{left:400, top:40, right:40, bottom:40}})

    for (item in corridorInfo) {

     // Type: Point
     if (corridorInfo[item].geomType === "point") {
      var data = [turf.pointsWithinPolygon(corridorInfo[item].data, bufferedCorridor).features.length];
     }

     // Type: Polygon
      if (corridorInfo[item].geomType === "polygon") {
        var dataFields = corridorInfo[item].dataFields;
        var count = [];
        var total = corridorInfo[item].total;
        if (total) var totalCount = 0;
        dataFields.forEach(function() {
         count.push(0);
        })
      // Iterate through features to check for corridor overlap
        for (i in corridorInfo[item].data.features) {
          var feature = corridorInfo[item].data.features[i];
          // We should be able to use the relatively new booleanIntersects function,
          // which is the inverse of booleanDisjoint,
          // but for some reason it isn't recognized.
          if (!turf.booleanDisjoint(bufferedCorridor, feature)) {
            // TODO: dedupe tiles using GEOID property (this is unique by block. Is there a better property?)
            // TODO: figure out why this function does not seem to capture all intersecting census blocks
            for (j in dataFields) {
              count[j] += +feature.properties[dataFields[j]];
            }
            if (total) {
              var percentage = [];
              totalCount += +feature.properties[total];
              for (j in dataFields) {
                percentage.push(Math.round(+count[j] / totalCount * 100));
              }
            }
          }
          var data = total ? percentage : count;
        }
      }
      //console.log(corridorInfo[item].id, data[0]);
      var maxIndex = 0;

      for (index in data) {
        if (data[index] > data[maxIndex]){maxIndex = parseFloat(index)}
      }

      // Populate UI display
      var section = d3.select('#corridor-info')
        .append('div')
        .attr('id', corridorInfo[item].id)

      var sectionInner = section
        .append('div')
        .classed('mt12', true);

      var title = sectionInner
        .append('span')
        .classed('txt-bold', true)
        .text(corridorInfo[item].text)

      if (data.length === 1){
        sectionInner
          .append('span')
          .text(data[0])
          .attr('class', 'fr')
      }
      else {
        var dataRow = section
          .selectAll('.dataRow')
          .data(data)
          .enter()
          .append('div')
          .attr('class', 'dataRow py1 mt6')
          .style('height', '18px')
        dataRow
          .append('div')
          .style('width', '30%')
          .style('display', 'inline-block')
          .style('float', 'left')
          .text(function(d,i) {
            return corridorInfo[item].secondaryText[i]
          })
          .attr('class', ' txt-s small py1')
          .style('color', function(d,i){
            var color = i === maxIndex ? '#448ee4' : 'black'
            return color
          })
          .classed('txt-bold', function(d,i){
            var bold = i === maxIndex
            return bold
          })

        var bar = dataRow
          .append('div')
          .style('width', '70%')
          .style('display', 'inline-block')
          .style('position', 'relative')
          .style('float', 'right')
          .style('height', '100%')
        bar
          .append('span')
          .attr('class', 'z5 absolute py1 px6 txt-s')
          .text(function(d){
            return d+'%'
          })
          .each(function(d,i){
            var color = i === maxIndex ? 'color-white' : 'color-black'
            d3.select(this).classed(color, true)
          })
          .classed('txt-bold', function(d,i){
            var bold = i === maxIndex
            return bold
          })
        bar
          .append('div')
          .style('width', function(d){
            return 100 * d/data[maxIndex] + '%'
          })
          .style('background-color', '#448ee4')
          .style('height', '100%')
          .each(function(d,i){
            var color = i === maxIndex ? 'bg-blue-light' : 'bg-darken10'
            d3.select(this).classed(color, true)
          })
      }

      sectionInner
        // Add data attribution
        .append('div')
        .attr('id', (corridorInfo[item].id + "-attribution"))
        .attr('class', ' txt-s small py1')
        .style('display', 'none')
        .html(corridorInfo[item].attribution)

        title
        // Add icon toggle for data attribution
        .append('a')
        .on('click', function() {
          // TODO: refactor the variable in this function to be more stable 
          var x = document.getElementById(this.parentElement.parentElement.parentElement.id + "-attribution");
          if (x.style.display === "none") {
            x.style.display = "block";
          } else {
            x.style.display = "none";
          }
        })
        .append('svg')
        .attr('class', 'icon inline ml6 opacity50')
        .html('<use xlink:href="#icon-question"/></svg>')
        // For future development:
        // A "map" icon which can be used to toggle
        // on/off a visualization of the data
        // on the map itself
        //  .append('a')
        //  .append('svg')
        //  .attr('class', 'icon inline opacity50')
        //  .html('<use xlink:href="#icon-map"/>')
    };

    document.getElementById('corridor-info').style.display = 'initial';
  }

  function drawBuffer(geojson){
   map.getSource('buffer')
    .setData(geojson)
  }

  function drawCollisions(geojson){
   map.getSource('collisions')
    .setData(geojson)
  }

  // Add a URL hash to represent the drawn line
  function encodeHash(){
   var encoded = '';
   corridor.features.forEach(function(line){
    var joinedCoords = line.geometry.coordinates.map(function(coord){
     return coord.join(',')
    })
    var joinedLine = joinedCoords.join(';');
    encoded += joinedLine+'&'
   })
   window.location.hash = encoded.slice(0,-1);
  }

  // Convert the URL hash to line geometry
  function decodeHash(){
   var hash = window.location.hash;
   if (hash.length < 3) return;
   var decodedGeometry = hash
    .replace('#','')
    .split('&')
    .map(function(line){
     var lineString = line.split(';').map(function(point){
      var pt = point.split(',').map(function(coord){
       return parseFloat(coord)
      });
      return pt
     })
     return turf.lineString(lineString)
    })
   return turf.featureCollection(decodedGeometry);
  }

 }).catch(function(err){
   if (err) throw err
 });
})
