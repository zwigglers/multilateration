import math from "mathjs";
import _ from "underscore";

let target_point = [100+Math.random()*200, 100+Math.random()*200];

let data_points = [];

for(let samples=0;samples<5;samples++) {
	let point = [Math.random()*400, Math.random()*400];
	let d = Math.round(math.distance(point, target_point)) + (Math.random()-0.5)*0;

	data_points[samples] = {
		x: point[0],
		y: point[1],
		d: d
	};
}

let x=[], y=[], d=[];

for(let i in data_points) {
	x.push(data_points[i].x);
	y.push(data_points[i].y);
	d.push(data_points[i].d);
}

// Cartesian
// target point (a,b) sample point (x,y)
const EXPR_S_i = math.compile("(a-x)^2 + (b-y)^2 - 2*d*sqrt( (a-x)^2 + (b-y)^2 ) + d^2");
const EXPR_dS_i__da = math.compile("-2*d*(a-x)/sqrt((a-x)^2+(b-y)^2)+2*a-2*x");
const EXPR_d2S_i__da2 = math.compile("-2*d*(a-x)(x-a)/((a-x)^2+(b-y)^2)^(3/2)-2*d/sqrt((a-x)^2+(b-y)^2)+2");
const EXPR_d2S_i__dbda = math.compile("-2*d*(a-x)(y-b)/((a-x)^2+(b-y)^2)^(3/2)");

function iSum(iFunc,a,b) {
	return _.reduce(_.range(data_points.length), (memo,i) => memo + iFunc(i,a,b), 0)
}

function S_i(i,a,b) { return EXPR_S_i.eval({a: a, b: b, x: x[i], y: y[i], d: d[i]}); }
function S(a,b) { return iSum(S_i,a,b); }

function dS_i__da(i,a,b) { return EXPR_dS_i__da.eval({a: a, b: b, x: x[i], y: y[i], d: d[i] }); }
function dS__da(a,b) { return iSum(dS_i__da,a,b); }

function dS_i__db(i,a,b) { return EXPR_dS_i__da.eval({a: b, b: a, x: y[i], y: x[i], d: d[i] }); }
function dS__db(a,b) { return iSum(dS_i__db,a,b); }

function d2S_i__da2(i,a,b) { return EXPR_d2S_i__da2.eval({a: a, b: b, x: x[i], y: y[i], d: d[i] }); }
function d2S__da2(a,b) { return iSum(d2S_i__da2,a,b); }

function d2S_i__dbda(i,a,b) { return EXPR_d2S_i__dbda.eval({a: a, b: b, x: x[i], y: y[i], d: d[i] }); }
function d2S__dbda(a,b) { return iSum(d2S_i__dbda,a,b); }

function d2S_i__dadb(i,a,b) { return EXPR_d2S_i__dbda.eval({a: b, b: a, x: y[i], y: x[i], d: d[i] }); }
function d2S__dadb(a,b) { return iSum(d2S_i__dadb,a,b); }

function d2S_i__db2(i,a,b) { return EXPR_d2S_i__da2.eval({a: b, b: a, x: y[i], y: x[i], d: d[i] }); }
function d2S__db2(a,b) { return iSum(d2S_i__db2,a,b); }

function J_S(a,b) {
	let arr = [
		[d2S__da2(a,b), d2S__dbda(a,b)],
		[d2S__dadb(a,b), d2S__db2(a,b)]
	];
	return math.matrix(arr);
}

let estimate = math.matrix([200,200]);

for(let iterations=0;iterations<10;iterations++) {
	console.log(estimate.toString());

	let a = estimate.get([0]);
	let b = estimate.get([1]);

	let jacobian = J_S(a,b);
	let jacobian_inv = math.inv(jacobian);
	let gradient = math.matrix([dS__da(a,b), dS__db(a,b)]);
	let newEstimate = math.subtract(estimate, math.multiply(jacobian_inv, gradient));

	console.log(newEstimate.toString());

	estimate = newEstimate;
}

let errorDistance = math.distance(estimate,target_point);

console.log('total-sample-error-squared', S(target_point[0],target_point[1]));
console.log('estimate-error', errorDistance);
