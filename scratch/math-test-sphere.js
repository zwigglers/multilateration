import math from "mathjs";
import _ from "underscore";

/** Extend Number object with method to convert numeric degrees to radians */
if (Number.prototype.toRadians === undefined) {
    Number.prototype.toRadians = function() { return this * Math.PI / 180; };
}

/** Extend Number object with method to convert radians to numeric (signed) degrees */
if (Number.prototype.toDegrees === undefined) {
    Number.prototype.toDegrees = function() { return this * 180 / Math.PI; };
}

const R = 6371000;

// all measurements in radians for now
function dist(lat1, lon1, lat2, lon2) {
	//Equirectangular approximation
	// var x = (lon2-lon1) * Math.cos((lat1+lat2)/2);
	// var y = (lat2-lat1);
	// var d = Math.sqrt(x*x + y*y) * R;
	// return d;

	// Spherical law of cosines
	var φ1 = lat1, φ2 = lat2, Δλ = (lon2-lon1); // gives d in metres
	return Math.acos( Math.sin(φ1)*Math.sin(φ2) + Math.cos(φ1)*Math.cos(φ2) * Math.cos(Δλ) ) * R;
}

let target_point = [1.321975.toRadians(), 103.824761.toRadians()];

let data_points = [];

for(let samples=0;samples<30;samples++) {
	let point = [
		target_point[0] + ((Math.random()-0.5)*0.036).toRadians(),
		target_point[1] + ((Math.random()-0.5)*0.08).toRadians()
	];
	let d = dist(target_point[0], target_point[1], point[0], point[1])+(Math.random()-0.5)*0;

	data_points[samples] = {
		x: point[0],
		y: point[1],
		d: d
	};
}

function ptd(point) {
	return [point[0].toDegrees(), point[1].toDegrees()];
}

console.log('Test Data');

console.log('Target Point', ptd(target_point));
console.log('Data Points');
for(let i in data_points) {
	console.log(ptd([data_points[i].x, data_points[i].y]), 'dist', data_points[i].d);
}


let x=[], y=[], d=[];

for(let i in data_points) {
	x.push(data_points[i].x);
	y.push(data_points[i].y);
	d.push(data_points[i].d);
}

// Spherical law of cosines
// target coord (rad) (a,b) sample coord (rad) (x,y)
const EXPR_S_i = math.compile("(acos( sin(a)*sin(x) + cos(a)*cos(x) * cos(y-b) ) * R)^2 - 2*(acos( sin(a)*sin(x) + cos(a)*cos(x) * cos(y-b) ) * R)*d + d^2");
const EXPR_dS_i__da = math.compile("(-2*R^2*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))+2*d*R*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a)))/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)");
const EXPR_d2S_i__da2 = math.compile("-2*R^2*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))^2/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)^(3/2)+2*d*R*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))^2/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)^(3/2)+2*R^2*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))^2/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)+2*R^2*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)-2*d*R*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)");
const EXPR_d2S_i__dbda = math.compile("-2*R^2*cos(a)cos(x)sin(y-b)*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)^(3/2)+2*d*R*cos(a)cos(x)sin(y-b)*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)^(3/2)+2*R^2*cos(a)cos(x)sin(y-b)*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)+2*R^2*sin(a)cos(x)sin(y-b)acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)-2*d*R*sin(a)cos(x)sin(y-b)/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)");

// Equirectangular approximation
// target coord (rad) (a,b) sample coord (rad) (x,y)
// const EXPR_S_i = math.compile("R^2*((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)-2*d*R*sqrt((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)+d^2");
// const EXPR_dS_i__da = math.compile("-2*d*R*(-(y-b)^2*sin((x+a)/2)*cos((x+a)/2)/2+a-x)/sqrt((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)+R^2*(-(y-b)^2*sin((x+a)/2)cos((x+a)/2)+2*a-2*x)");
// const EXPR_d2S_i__da2 = math.compile("-2*d*R*(-(y-b)^2*sin((x+a)/2)cos((x+a)/2)/2+a-x)*((y-b)^2*sin((x+a)/2)cos((x+a)/2)/2+x-a)/((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)^(3/2)+d*R*((y-b)^2*(cos((x+a)/2))^2/2-(y-b)^2*(sin((x+a)/2))^2/2-2)/sqrt((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)+R^2*((y-b)^2*(sin((x+a)/2))^2/2-(y-b)^2*(cos((x+a)/2))^2/2+2)");
// const EXPR_d2S_i__dbda = math.compile("-2*d*R*(y-b)*(cos((x+a)/2))^2*(-(y-b)^2*sin((x+a)/2)*cos((x+a)/2)/2+a-x)/((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)^(3/2)-2*d*R*(y-b)sin((x+a)/2)cos((x+a)/2)/sqrt((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)+(2y-2b)R^2*sin((x+a)/2)cos((x+a)/2)");

function iSum(iFunc,a,b) {
	return _.reduce(_.range(data_points.length), (memo,i) => memo + iFunc(i,a,b), 0);
}

function S_i(i,a,b) { return EXPR_S_i.eval({a: a, b: b, x: x[i], y: y[i], d: d[i], R:R }); }
function S(a,b) { return iSum(S_i,a,b); }

function dS_i__da(i,a,b) { return EXPR_dS_i__da.eval({a: a, b: b, x: x[i], y: y[i], d: d[i], R:R }); }
function dS__da(a,b) { return iSum(dS_i__da,a,b); }

function dS_i__db(i,a,b) { return EXPR_dS_i__da.eval({a: b, b: a, x: y[i], y: x[i], d: d[i], R:R }); }
function dS__db(a,b) { return iSum(dS_i__db,a,b); }

function d2S_i__da2(i,a,b) { return EXPR_d2S_i__da2.eval({a: a, b: b, x: x[i], y: y[i], d: d[i], R:R }); }
function d2S__da2(a,b) { return iSum(d2S_i__da2,a,b); }

function d2S_i__dbda(i,a,b) { return EXPR_d2S_i__dbda.eval({a: a, b: b, x: x[i], y: y[i], d: d[i], R:R }); }
function d2S__dbda(a,b) { return iSum(d2S_i__dbda,a,b); }

function d2S_i__dadb(i,a,b) { return EXPR_d2S_i__dbda.eval({a: b, b: a, x: y[i], y: x[i], d: d[i], R:R }); }
function d2S__dadb(a,b) { return iSum(d2S_i__dadb,a,b); }

function d2S_i__db2(i,a,b) { return EXPR_d2S_i__da2.eval({a: b, b: a, x: y[i], y: x[i], d: d[i], R:R }); }
function d2S__db2(a,b) { return iSum(d2S_i__db2,a,b); }

function J_S(a,b) {
	let arr = [
		[d2S__da2(a,b), d2S__dbda(a,b)],
		[d2S__dadb(a,b), d2S__db2(a,b)]
	];
	return math.matrix(arr);
}

console.log("START ESTIMATING")

let estimate = math.matrix([1.310900.toRadians(), 103.826347.toRadians()]);

for(let iterations=0;iterations<10;iterations++) {
	let errorDistance = dist(estimate.get([0]),estimate.get([1]),target_point[0],target_point[1]);
	console.log('estimate', estimate.get([0]).toDegrees(), estimate.get([1]).toDegrees(), 'error', errorDistance);

	let a = estimate.get([0]);
	let b = estimate.get([1]);

	let jacobian = J_S(a,b);
	let jacobian_inv = math.inv(jacobian);
	let gradient = math.matrix([dS__da(a,b), dS__db(a,b)]);
	let newEstimate = math.subtract(estimate, math.multiply(jacobian_inv, gradient));

	estimate = newEstimate;
}


console.log('FINAL ESTIMATE');
let errorDistance = dist(estimate.get([0]),estimate.get([1]),target_point[0],target_point[1]);
console.log('estimate', estimate.get([0]).toDegrees(), estimate.get([1]).toDegrees(), 'error', errorDistance);
console.log('total-sample-error-squared', S(target_point[0],target_point[1],target_point[2]));