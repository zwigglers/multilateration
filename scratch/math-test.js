import math from "mathjs";
import _ from "underscore";

let target_point = [100+Math.random()*200, 100+Math.random()*200, 100+Math.random()*200];

let data_points = [];

for(let samples=0;samples<100;samples++) {
	let point = [Math.random()*400, Math.random()*400, Math.random()*400];
	let d = Math.round(math.distance(point, target_point)) + (Math.random()-0.5)*50;

	data_points[samples] = {
		x: point[0],
		y: point[1],
		z: point[2],
		d: d
	};
}

let x=[], y=[], z=[], d=[];

for(let i in data_points) {
	x.push(data_points[i].x);
	y.push(data_points[i].y);
	z.push(data_points[i].z);
	d.push(data_points[i].d);
}

console.log('Test Data');

console.log('Target Point', target_point);
console.log('Data Points');
for(let i in data_points) {
	console.log(_.values(data_points[i]));
}


// Cartesian
// target point (a,b,c) sample point (x,y)
const EXPR_S_i = math.compile("( sqrt( (a-x)^2 + (b-y)^2 + (c-z)^2 ) - d )^2");
const EXPR_dS_i__da = math.compile("-2*d*(a-x)/sqrt(x^2-2*a*x+y^2-2*b*y+z^2-2*c*z+a^2+b^2+c^2)+2*a-2*x");
const EXPR_d2S_i__da2 = math.compile("-2*d*(a-x)*(x-a)/(x^2-2*a*x+y^2-2*b*y+z^2-2*c*z+a^2+b^2+c^2)^(3/2)-2*d/sqrt(x^2-2*a*x+y^2-2*b*y+z^2-2*c*z+a^2+b^2+c^2)+2");
const EXPR_d2S_i__dbda = math.compile("-2*d*(a-x)*(y-b)/(x^2-2*a*x+y^2-2*b*y+z^2-2*c*z+a^2+b^2+c^2)^(3/2)");

// summation function
function iSum(iFunc,a,b,c) { return _.reduce(_.range(data_points.length), (memo,i) => memo + iFunc(i,a,b,c), 0); }

// squared error function
function S_i(i,a,b,c) { return EXPR_S_i.eval({a: a, b: b, c: c, x: x[i], y: y[i], z: z[i], d: d[i]}); }
function S(a,b,c) { return iSum(S_i,a,b,c); }

// first partial derivative
function dS_i__da(i,a,b,c) { return EXPR_dS_i__da.eval({a: a, b: b, c: c, x: x[i], y: y[i], z: z[i], d: d[i] }); }
function dS__da(a,b,c) { return iSum(dS_i__da,a,b,c); }

function dS_i__db(i,a,b,c) { return EXPR_dS_i__da.eval({a: b, b: a, c: c, x: y[i], y: x[i], z: z[i], d: d[i] }); }
function dS__db(a,b,c) { return iSum(dS_i__db,a,b,c); }

function dS_i__dc(i,a,b,c) { return EXPR_dS_i__da.eval({a: c, b: b, c: a, x: z[i], y: y[i], z: x[i], d: d[i] }); }
function dS__dc(a,b,c) { return iSum(dS_i__dc,a,b,c); }

// second partial derivatives
function d2S_i__da2(i,a,b,c) { return EXPR_d2S_i__da2.eval({a: a, b: b, c: c, x: x[i], y: y[i], z: z[i], d: d[i] }); }
function d2S__da2(a,b,c) { return iSum(d2S_i__da2,a,b,c); }

function d2S_i__db2(i,a,b,c) { return EXPR_d2S_i__da2.eval({a: b, b: a, c: c, x: y[i], y: x[i], z: z[i], d: d[i] }); }
function d2S__db2(a,b,c) { return iSum(d2S_i__db2,a,b,c); }

function d2S_i__dc2(i,a,b,c) { return EXPR_d2S_i__da2.eval({a: c, b: b, c: a, x: z[i], y: y[i], z: x[i], d: d[i] }); }
function d2S__dc2(a,b,c) { return iSum(d2S_i__dc2,a,b,c); }


function d2S_i__dbda(i,a,b,c) { return EXPR_d2S_i__dbda.eval({a: a, b: b, c: c, x: x[i], y: y[i], z: z[i], d: d[i] }); }
function d2S__dbda(a,b,c) { return iSum(d2S_i__dbda,a,b,c); }

function d2S_i__dcda(i,a,b,c) { return EXPR_d2S_i__dbda.eval({a: a, b: c, c: b, x: x[i], y: z[i], z: y[i], d: d[i] }); }
function d2S__dcda(a,b,c) { return iSum(d2S_i__dcda,a,b,c); }

function d2S_i__dadb(i,a,b,c) { return EXPR_d2S_i__dbda.eval({a: b, b: a, c: c, x: y[i], y: x[i], z: z[i], d: d[i] }); }
function d2S__dadb(a,b,c) { return iSum(d2S_i__dadb,a,b,c); }

function d2S_i__dcdb(i,a,b,c) { return EXPR_d2S_i__dbda.eval({a: b, b: c, c: a, x: y[i], y: z[i], z: x[i], d: d[i] }); }
function d2S__dcdb(a,b,c) { return iSum(d2S_i__dcdb,a,b,c); }

function d2S_i__dadc(i,a,b,c) { return EXPR_d2S_i__dbda.eval({a: c, b: a, c: b, x: z[i], y: x[i], z: y[i], d: d[i] }); }
function d2S__dadc(a,b,c) { return iSum(d2S_i__dadc,a,b,c); }

function d2S_i__dbdc(i,a,b,c) { return EXPR_d2S_i__dbda.eval({a: c, b: b, c: a, x: z[i], y: y[i], z: x[i], d: d[i] }); }
function d2S__dbdc(a,b,c) { return iSum(d2S_i__dbdc,a,b,c); }

// jacobian
function J_S(a,b,c) {
	let arr = [
		[d2S__da2(a,b,c), d2S__dbda(a,b,c), d2S__dcda(a,b,c) ],
		[d2S__dadb(a,b,c), d2S__db2(a,b,c), d2S__dcdb(a,b,c) ],
		[d2S__dadc(a,b,c), d2S__dbdc(a,b,c), d2S__dc2(a,b,c) ]
	];
	return math.matrix(arr);
}

console.log('START ESTIMATION');

let estimate = math.matrix([200,200,200]);

for(let iterations=0;iterations<10;iterations++) {

	let errorDistance = math.distance(estimate,target_point);
	console.log(estimate.toString(), 'error:', errorDistance);

	let a = estimate.get([0]);
	let b = estimate.get([1]);
	let c = estimate.get([2]);

	let jacobian = J_S(a,b,c);
	let jacobian_inv = math.inv(jacobian);
	let gradient = math.matrix([dS__da(a,b,c), dS__db(a,b,c), dS__dc(a,b,c)]);
	let newEstimate = math.subtract(estimate, math.multiply(jacobian_inv, gradient));

	estimate = newEstimate;
}

console.log('FINAL ESTIMATE');
let errorDistance = math.distance(estimate,target_point);
console.log(estimate.toString(), 'error:', errorDistance);
console.log('total-sample-error-squared', S(target_point[0],target_point[1],target_point[2]));
