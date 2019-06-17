let UnionFind = require('node-union-find'),
    fs = require('fs'),
    turf = require('@turf/turf'),
    rbush = require('rbush'),
    colorvert = require('colorvert');

let lanes_data = JSON.parse(fs.readFileSync('data/Bicycle_Lanes.geojson'));
let trails_data = JSON.parse(fs.readFileSync('data/Bike_Trails.geojson'));
let features = [
    ...lanes_data.features.map((f) => { f.properties.source_dataset = 'lanes'; return f; }),
    ...trails_data.features.map((f) => { f.properties.source_dataset = 'trails'; return f; })
]

let uf = new UnionFind([...features.keys()]);

let buffered = [],
    bboxes = [],
    tree = rbush();
for (let i = 0; i < features.length; i++) {
    buffered[i] = turf.buffer(features[i], 10, {units: "meters"});
    let bbox = turf.bbox(buffered[i]);
    bboxes[i] = {
        minX: bbox[0],
        minY: bbox[1],
        maxX: bbox[2],
        maxY: bbox[3],
        idx: i
    }
}
tree.load(bboxes);

for (let i = 0; i < features.length; i++) {
    for (let match of tree.search(bboxes[i])) {
        if (match.idx > i && !uf.inSameGroup(i, match.idx)) {
            let intersects = false;
            try {
                let f1 = buffered[i], f2 = buffered[match.idx];

                if (f1.geometry.type == "MultiPolygon" && f2.geometry.type == "Polygon") f2 = turf.multiPolygon([f2.geometry.coordinates]);
                if (f2.geometry.type == "MultiPolygon" && f1.geometry.type == "Polygon") f1 = turf.multiPolygon([f1.geometry.coordinates]);

                intersects = turf.booleanOverlap(f1, f2);
            } catch(err) {
                try {
                    let f1 = features[i], f2 = features[match.idx];

                    if (f1.geometry.type == "MultiLineString" && f2.geometry.type == "LineString") f2 = turf.multiLineString([f2.geometry.coordinates]);
                    if (f2.geometry.type == "MultiLineString" && f1.geometry.type == "LineString") f1 = turf.multiLineString([f1.geometry.coordinates]);

                    intersects = turf.booleanOverlap(f1, f2);
                } catch(err2) {}
            }

            if (intersects) {
                uf.union(i, match.idx);
                console.log("merging", i, match.idx);
            }
        }
    }
}

let lengths = new Map();
let colors = new Map();

for (let i = 0; i < features.length; i++) {
    let cluster = uf.find(i).getGroupLeader();
    features[i].properties.cluster = cluster;
    let existing = lengths.has(cluster) ? lengths.get(cluster) : 0;
    lengths.set(cluster, existing + turf.length(features[i]), {units: 'miles'});
}

for (let i = 0; i < features.length; i++) {
    let cluster = features[i].properties.cluster
    let color = colors.has(cluster) ?
        colors.get(cluster) :
        colors.set(cluster, colorvert.hsl_to_hex(Math.floor(Math.random() * 360), 100, 25 + Math.random() * 25)).get(cluster);
    features[i].properties.stroke = color;
    features[i].properties.network_length = lengths.get(cluster);
}

let out = {
    "type": "FeatureCollection",
    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    "features": features
}

fs.writeFileSync("data/out.geojson", JSON.stringify(out, null, 4));