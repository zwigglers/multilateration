import math from "mathjs";

class MLTCartesian2D {
	constructor() {
		this.x = [];
		this.y = [];
		this.d = [];
		this.observations = 0;
		this._initExprDone = false;
	}

	// adds an observation
	observe(point2d, dist) {
		// TODO data checking?
		this.x.push(point2d[0]);
		this.y.push(point2d[1]);
		this.d.push(dist);
		this.observations++;
	}

	// returns an estimation of the target point
	estimate(initial, iterations=5, verbose=false) {
		// TODO data checking?

		this.initExpr();

		let estimate = initial;

		for(let j=0;j<iterations;j++) {
			let a = estimate[0];
			let b = estimate[1];

			let jacobian = this.J_S(a,b);
			let jacobian_inv = math.inv(jacobian);
			let gradient = [this.dS__da(a,b), this.dS__db(a,b)];
			let newEstimate = math.subtract(estimate, math.multiply(jacobian_inv, gradient));

			estimate = newEstimate;

			if(verbose) {
				console.log("iteration %i> %s", j+1, estimate.toString());
			}

		}

		return estimate;
	}

	// tells you the distance between two points
	dist(pointA, pointB) {
		// euclian distance
		return math.distance(pointA, pointB);
	}

	// EXPRESSIONS
	initExpr() {
		if(this._initExprDone) {
			return;
		}
		this._initExprDone = true;

		// Cartesian
		// target point (a,b) sample point (x,y)
		this.EXPR = {
			S_i: math.compile("(a-x)^2 + (b-y)^2 - 2*d*sqrt( (a-x)^2 + (b-y)^2 ) + d^2"),
			dS_i__da: math.compile("-2*d*(a-x)/sqrt((a-x)^2+(b-y)^2)+2*a-2*x"),
			d2S_i__da2: math.compile("-2*d*(a-x)(x-a)/((a-x)^2+(b-y)^2)^(3/2)-2*d/sqrt((a-x)^2+(b-y)^2)+2"),
			d2S_i__dbda: math.compile("-2*d*(a-x)(y-b)/((a-x)^2+(b-y)^2)^(3/2)")
		};
	}

	// MATH FUNCTIONS

	// summation over i
	iSum(iFunc,a,b) {
		let sum = 0;
		for(let i=0;i<this.observations;i++) {
			sum += iFunc.bind(this)(i,a,b);
		}
		return sum;
	}

	// squared error function
	S_i(i,a,b) { return this.EXPR.S_i.eval({a: a, b: b, x: this.x[i], y: this.y[i], d: this.d[i]}); }
	S(a,b) { return this.iSum(this.S_i,a,b); }

	// first partial derivative
	dS_i__da(i,a,b) { return this.EXPR.dS_i__da.eval({a: a, b: b, x: this.x[i], y: this.y[i], d: this.d[i] }); }
	dS__da(a,b) { return this.iSum(this.dS_i__da,a,b); }

	dS_i__db(i,a,b) { return this.EXPR.dS_i__da.eval({a: b, b: a, x: this.y[i], y: this.x[i], d: this.d[i] }); }
	dS__db(a,b) { return this.iSum(this.dS_i__db,a,b); }

	// second partial derivatives
	d2S_i__da2(i,a,b) {  return this.EXPR.d2S_i__da2.eval({a: a, b: b, x: this.x[i], y: this.y[i], d: this.d[i] }); }
	d2S__da2(a,b) { return this.iSum(this.d2S_i__da2,a,b); }

	d2S_i__dbda(i,a,b) { return this.EXPR.d2S_i__dbda.eval({a: a, b: b, x: this.x[i], y: this.y[i], d: this.d[i] }); }
	d2S__dbda(a,b) { return this.iSum(this.d2S_i__dbda,a,b); }

	d2S_i__dadb(i,a,b) { return this.EXPR.d2S_i__dbda.eval({a: b, b: a, x: this.y[i], y: this.x[i], d: this.d[i] }); }
	d2S__dadb(a,b) { return this.iSum(this.d2S_i__dadb,a,b); }

	d2S_i__db2(i,a,b) { return this.EXPR.d2S_i__da2.eval({a: b, b: a, x: this.y[i], y: this.x[i], d: this.d[i] }); }
	d2S__db2(a,b) { return this.iSum(this.d2S_i__db2,a,b); }

	// jacobian
	J_S(a,b) {
		return [
			[this.d2S__da2(a,b), this.d2S__dbda(a,b)],
			[this.d2S__dadb(a,b), this.d2S__db2(a,b)]
		];
	}

}

export default MLTCartesian2D;