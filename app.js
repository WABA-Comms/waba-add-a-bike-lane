mapboxgl.accessToken = 'pk.eyJ1Ijoibmlja2kiLCJhIjoiczVvbFlXQSJ9.1Gegt3V_MTupW6wfjxq2QA';

var map = new mapboxgl.Map({
		container: 'map',
		style: './add-bike-lane-style.json',
		center: [-77.007945, 38.896870],
		zoom: 12

});

var draw = new MapboxDraw({
	controls: {
		point: false,
		polygon: false
	}
});
map.addControl(draw);

map.on('load', function() {
	d3.json('scripts/collisions/collisions.geojson', function(err, resp){
	if (err) throw err
	resp.features = resp.features.filter(function(ft){return typeof ft.geometry.coordinates[0] === 'number'})
	collisions = resp;

	corridorInfo = [
		{
			id: 'crashes-total',
			text: 'total crashes',
					geomType: 'point',
			data: collisions
		},
		{
			id: 'crashes-cyclists',
			text: 'bike-related crashes',
				geomType: 'point',
			data: turf.featureCollection(collisions.features.filter(function(ft){
				return ft.properties.TOTAL_BICYCLES > 0
			}))
		},
		{
			id: 'crashes-pedestrians',
			text: 'pedestrian-related crashes',
					geomType: 'point',
			data: turf.featureCollection(collisions.features.filter(function(ft){
				return ft.properties.TOTAL_PEDESTRIANS > 0
			}))
		},
			{
				id: 'speeding-violations',
				text: 'Speeding violations',
				geomType: 'point',
				data: turf.featureCollection(map.querySourceFeatures('composite', {
					// Currently only Dec 2018 data
					sourceLayer: 'moving-violations-dec-2018-re-7lav76',
					filter: ['in', 'VIOLATIONCODE', "T118", "T119", "T120", "T121", "T122"]
				}))
			},
			{
				id: 'population',
				text: 'Population',
				geomType: 'polygon',
				data: turf.featureCollection(map.querySourceFeatures('composite', {
					sourceLayer: 'combined_features-7kmirr'
				})),
				dataFields: ['population_total']
			},
			{
				id: 'modeshare',
				text: 'Modeshare',
				secondaryText: [
					'Bicycle',
					'Walking',
					'Automobile',
					'Motorcycle',
					'Public transportation',
					'Taxicab',
					'Other means'
				],
				geomType: 'polygon',
				data: turf.featureCollection(map.querySourceFeatures('composite', {
					sourceLayer: 'combined_features-7kmirr',
				})),
				dataFields: [
					'transport_bicycle',
					'transport_walked',
					'transport_car_truck_or_van',
					'transport_motorcycle',
					'transport_public_transportation_excluding_taxicab',
					'transport_taxicab',
					'transport_other_means'
					],
				total: 'transport_total'
			},
			{
				id: 'income',
				text: 'Income',
				secondaryText: [
					'<10,000',
					'10,000–14,999',
					'15,000–19,999',
					'20,000–24,999',
					'25,000–29,999',
					'30,000–34,999',
					'35,000–39,999',
					'40,000–44,999',
					'45,000–49,999',
					'50,000–59,999',
					'60,000–74,999',
					'75,000–99,999',
					'100,000–124,999',
					'125,000–149,999',
					'150,000–199,999',
					'>200,000'
				],
				geomType: 'polygon',
				data: turf.featureCollection(map.querySourceFeatures('composite', {
					sourceLayer: 'combined_features-7kmirr',
				})),
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
				total: 'income_total'
			}
	];


// Since we are planning to also visualize the corridor data on the map, it's probably
// easiest to reuse the vector tiles for data querying.

// TODO: filter these crash queries to only include 2016 and later
// However, the `REPORTDATE` field contains string values, not numbers, so we may want to reformat these first
// although it would make data updates easier if we didn't reformat it...
	map
	.addLayer({
		'id':'collisions',
		'type':'circle',
		'source': {
			'type': 'geojson',
			'data': {
				"type": "FeatureCollection",
				"features": []
			}
		},
		'paint':{
			'circle-radius':3
		}
	})
	.addLayer({
		'id':'buffer',
		'type':'fill',
		'source': {
			'type': 'geojson',
			'data': {
				"type": "FeatureCollection",
				"features": []
			}
		},
		'paint':{
			'fill-opacity':0.25,
			'fill-color': '#abcdef'
		}
	})

	map.on('draw.create', updateCorridor);
	map.on('draw.delete', updateCorridor);
	map.on('draw.update', updateCorridor);
	
	function updateCorridor(e) {

		var corridor = draw.getAll();

		// Currently, this allows you to draw multiple unconnected lines as a "corridor"
		bufferedCorridor = turf.buffer(corridor, 10, {units: 'meters'});
		drawBuffer(bufferedCorridor)
		drawCollisions(turf.pointsWithinPolygon(collisions, bufferedCorridor));
		map.fitBounds(turf.bbox(bufferedCorridor), {padding:{left:400, top:20, right:20, bottom:20}})

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
					if (total) {
						var totalCount = 0;
					}
					dataFields.forEach(function() {
						count.push(0);
					})
					// Iterate through features to check for corridor overlap
					//console.log(corridorInfo[item]);
					for (i in corridorInfo[item].data.features) {
						var feature = corridorInfo[item].data.features[i];
						//console.log(feature);
						// We should be able to use the relatively new booleanIntersects function,
						// which is the inverse of booleanDisjoint,
						// but for some reason it isn't recognized.
						//if (!turf.booleanDisjoint(bufferedCorridor.features[0].geometry, feature)) {
						if (!turf.booleanDisjoint(bufferedCorridor, feature)) {
							//console.log(feature.properties[measurements[0]]);
							// TODO: dedupe tiles using GEOID property (this is unique by block. Is there a better property?)
							// TODO: add optional % calculation
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

				if (document.getElementById('corridor-info-table').rows.length > item) {
					var row = document.getElementById(corridorInfo[item].id);
					var desc = row.cells[0];
					var more = row.cells[1];
				} else {
					var row = document.getElementById('corridor-info-table').insertRow(-1);
					row.id = corridorInfo[item].id;
					//console.log("Added row in corridor info table: " + row.id);
					var desc = row.insertCell(0);
					var more = row.insertCell(1);
				};

				console.log(data);

				if (data.length == 1) desc.innerHTML =  corridorInfo[item].text + ': ' + '<span class="txt-bold">' + data[0] + '</span> ';
				else {
					console.log(data);
					// TODO: Add additional rows for the sub-items
					desc.innerHTML =  corridorInfo[item].text + '</br>';
					for (j in corridorInfo[item].secondaryText) {
						desc.innerHTML += '<p class=secondaryText>' + corridorInfo[item].secondaryText[j] + ': ' + '<span class="txt-bold">' + data[j] + '%</span></p>';
						//var secondaryText = document.createElement('p');
						//secondaryText.innerHTML = '<p>' + corridorInfo[item].secondaryText[j] + ': ' + '<span class="txt-bold">' + data[j] + '</span></p>';
						//desc.appendChild(secondaryText);
					}
				};
				// "More" section is a placeholder for accessing:
				// 1. Information about the data the statistic was derived from
				// (we could also consolidate all the data info in one place elsewhere)
				// 2. Toggling on/off visualizations on the map for that statistic
				more.innerHTML = '<svg class="icon inline"><use xlink:href="#icon-question"/></svg> <svg class="icon inline"><use xlink:href="#icon-map"/></svg>'
			};
			document.getElementById('corridor-info').style.visibility = 'visible';

	}

		//console.log(corridorInfo[2]);
	//console.log(corridorInfo[3]);

	// Display census data on map to help debug
	/*
	map.addLayer(
		{
			"id": "census-blocks",
			"source": "composite",
			"source-layer": "combined_features-7kmirr",
			"type": "line",
			"paint": {
				"line-color": "#0f0",
				"line-opacity": 1
			}
		}
	);
	map.addLayer(
		{
			"id": "census-blocks-population",
			"source": "composite",
			"source-layer": "combined_features-7kmirr",
			"type": "symbol",
			"layout": {
				"text-field": ["get", "population_total"],
				"symbol-placement": "point",
				"text-size": 10
			},
			"paint": {
				"text-color": "red"
			}
		}
	);
	*/

	function drawBuffer(geojson){
		map.getSource('buffer')
			.setData(geojson)
	}

	function drawCollisions(geojson){
		map.getSource('collisions')
			.setData(geojson)
	}
});
})
