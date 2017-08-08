// import MLTCartesian2D from "../lib/MLTCartesian2D";
// import MLTCartesian3D from "../lib/MLTCartesian3D";
// import MLTGeo2D from "../lib/MLTGeo2D";
// import MLTGeo3D from "../lib/MLTGeo3D";

import MLT from '../lib/Multilaterator';

function testCartesian2D() {

	// 2D CARTESIAN

	let scanner = MLT('2d-cartesian');

	let target_point = [100+Math.random()*200, 100+Math.random()*200];

	let data_points = [];

	for(let samples=0;samples<5;samples++) {
		let point = [Math.random()*400, Math.random()*400];
		let d = Math.round(scanner.dist(point, target_point)) + (Math.random()-0.5)*25;

		data_points[samples] = {
			x: point[0],
			y: point[1],
			d: d
		};
	}

	//// start
	console.log('2D Cartesian');
	console.log('target-point', target_point);

	for(let i in data_points) {
		scanner.observe([data_points[i].x, data_points[i].y], data_points[i].d);
	}

	let estimate = scanner.estimate(5,true);

	console.log('estimate %s, error %s', estimate, scanner.dist(estimate,target_point));

}

function testCartesian3D() {

	// 3D CARTESIAN

	let scanner = MLT('3d-cartesian');

	let target_point = [100+Math.random()*200, 100+Math.random()*200, 100+Math.random()*200];

	let data_points = [];

	for(let samples=0;samples<5;samples++) {
		let point = [Math.random()*400, Math.random()*400, Math.random()*400];
		let d = Math.round(scanner.dist(point, target_point)) + (Math.random()-0.5)*50;

		data_points[samples] = {
			x: point[0],
			y: point[1],
			z: point[2],
			d: d
		};
	}

	//// start
	console.log('3D Cartesian');
	console.log('target-point', target_point);

	for(let i in data_points) {
		scanner.observe([data_points[i].x, data_points[i].y, data_points[i].z], data_points[i].d);
	}

	let estimate = scanner.estimate(5,true);

	console.log('estimate %s, error %s', estimate, scanner.dist(estimate,target_point));
}

function testGeo2D(distMethod = 'eceftransform') {

	////// LATLON
	///
	let scanner = MLT('2d-geo', distMethod);

	let target_point = [37.783902, -122.442026];

	let data_points = [];

	for(let samples=0;samples<20;samples++) {
		let point = [
			target_point[0] + (Math.random()-0.5)*0.036,
			target_point[1] + (Math.random()-0.5)*0.08
		];
		let d = Math.round(scanner.dist(point, target_point)) + (Math.random()-0.5)*50;

		data_points[samples] = {
			lat: point[0],
			lon: point[1],
			d: d
		};
	}

	//// start
	console.log('2D Geo, distance method = ', distMethod);
	console.log('target-point', target_point);

	for(let i in data_points) {
		scanner.observe([data_points[i].lat, data_points[i].lon], data_points[i].d);
	}

	let estimate = scanner.estimate(5,true);

	console.log('estimate', estimate, 'error', scanner.dist(estimate,target_point));
}

function testGeo3D(distMethod = 'eceftransform') {

	////// LATLON
	let scanner = MLT('3d-geo', distMethod);

	let target_point = [37.783902, -122.442026, 1000];

	let data_points = [];

	for(let samples=0;samples<20;samples++) {
		let point = [
			target_point[0] + (Math.random()-0.5)*0.036,
			target_point[1] + (Math.random()-0.5)*0.08,
			target_point[2] + (Math.random()-0.5)*1000
		];
		let d = Math.round(scanner.dist(point, target_point)) + (Math.random()-0.5)*50;

		data_points[samples] = {
			lat: point[0],
			lon: point[1],
			alt: point[2],
			d: d
		};
	}

	//// start
	console.log('3D Geo, distance method = ', distMethod);
	console.log('target-point', target_point);

	for(let i in data_points) {
		scanner.observe([data_points[i].lat, data_points[i].lon, data_points[i].alt], data_points[i].d);
	}

	let estimate = scanner.estimate(5,true);

	console.log('estimate', estimate, 'error', scanner.dist(estimate,target_point));
}

testCartesian2D();
testCartesian3D();
testGeo2D();
testGeo3D();