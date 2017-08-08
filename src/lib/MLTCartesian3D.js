import math from "mathjs";
import _ from "lodash";

import MLTCartesian2D from './MLTCartesian2D';

class MLTCartesian3D extends MLTCartesian2D {
	constructor() {
		super();

		this.z = [];
	}

	// adds an observation
	observe(point3d, dist) {
		// TODO data checking?

		super.observe(point3d, dist);
		this.z.push(point3d[2]);
	}

	initial() {

		this.initExpr();

		if(this.observations < 3) {
			throw new Error('Not enough observations');
		}

		let solutions = [];

		for(let i=0;i<this.observations-2;i++) {

			let A = [];
			let b = [];

			for(let j=i;j<i+3;j++) {
				A.push([
					2*( this.x[j] - this.x[j+1] ),
					2*( this.y[j] - this.y[j+1] ),
					2*( this.z[j] - this.z[j+1] )
				]);
				b.push(
					(Math.pow(this.x[j],2)+Math.pow(this.y[j],2)+Math.pow(this.z[j],2)-Math.pow(this.d[j],2)) - (Math.pow(this.x[j+1],2)+Math.pow(this.y[j+1],2)+Math.pow(this.z[j+1],2)-Math.pow(this.d[j+1],2))
				);
			}

			let tmp = math.lusolve(A,b);
			let sol = [tmp[0][0], tmp[1][0], tmp[2][0]];

			solutions.push(sol);
		}

		// pick the solution with least error
		return _.minBy(solutions, (sol)=>this.S.apply(this,sol));
	}

	// returns an estimation of the target point
	estimate(iterations=5, verbose=false) {

		this.initExpr();

		let estimate = this.initial();

		for(let j=0;j<iterations;j++) {
			let a = estimate[0];
			let b = estimate[1];
			let c = estimate[2];

			let jacobian = this.J_S(a,b,c);

			let jacobian_inv = math.inv(jacobian);
			let gradient = [this.dS__da(a,b,c), this.dS__db(a,b,c), this.dS__dc(a,b,c)];
			let newEstimate = math.subtract(estimate, math.multiply(jacobian_inv, gradient));

			estimate = newEstimate;

			if(verbose) {
				console.log("iteration %i> %s", j+1, estimate.toString());
			}

		}

		return estimate;
	}

	// EXPRESSIONS
	initExpr() {
		if(this._initExprDone) {
			return;
		}
		this._initExprDone = true;

		// Cartesian
		// target point (a,b) sample point (x,y)
		// We could calculate the derivatives on the fly, but it turns out to be a lot slower
		// let S_i = math.parse("(sqrt((a-x)^2 + (b-y)^2 + (c-z)^2) - d)^2");
		// let dS_i__da = math.derivative(S_i, 'a', {simplify: false});
		// let d2S_i__da2 = math.derivative(dS_i__da,'a', {simplify: false});
		// let d2S_i__dbda = math.derivative(dS_i__da,'b', {simplify: false});

		// this.EXPR = _.each({ S_i, dS_i__da, d2S_i__da2, d2S_i__dbda },(v) => v.compile());

		this.EXPR = {
			S_i: math.compile("(sqrt((a-x)^2 + (b-y)^2 + (c-z)^2) - d)^2"),
			dS_i__da: math.compile("-2*d*(a-x)/sqrt(x^2-2*a*x+y^2-2*b*y+z^2-2*c*z+a^2+b^2+c^2)+2*a-2*x"),
			d2S_i__da2: math.compile("-2*d*(a-x)*(x-a)/(x^2-2*a*x+y^2-2*b*y+z^2-2*c*z+a^2+b^2+c^2)^(3/2)-2*d/sqrt(x^2-2*a*x+y^2-2*b*y+z^2-2*c*z+a^2+b^2+c^2)+2"),
			d2S_i__dbda: math.compile("-2*d*(a-x)*(y-b)/(x^2-2*a*x+y^2-2*b*y+z^2-2*c*z+a^2+b^2+c^2)^(3/2)")
		};
	}

	// MATH FUNCTIONS

	// summation over i
	iSum(iFunc,a,b,c) {
		let sum = 0;
		for(let i=0;i<this.observations;i++) {
			sum += iFunc.bind(this)(i,a,b,c);
		}
		return sum;
	}

	// squared error function
	S_i(i,a,b,c) { return this.EXPR.S_i.eval({a: a, b: b, c: c, x: this.x[i], y: this.y[i], z: this.z[i], d: this.d[i]}); }
	S(a,b,c) { return this.iSum(this.S_i,a,b,c); }

	// first partial derivative
	dS_i__da(i,a,b,c) { return this.EXPR.dS_i__da.eval({a: a, b: b, c: c, x: this.x[i], y: this.y[i], z: this.z[i], d: this.d[i] }); }
	dS__da(a,b,c) { return this.iSum(this.dS_i__da,a,b,c); }

	dS_i__db(i,a,b,c) { return this.EXPR.dS_i__da.eval({a: b, b: a, c: c, x: this.y[i], y: this.x[i], z: this.z[i], d: this.d[i] }); }
	dS__db(a,b,c) { return this.iSum(this.dS_i__db,a,b,c); }

	dS_i__dc(i,a,b,c) { return this.EXPR.dS_i__da.eval({a: c, b: b, c: a, x: this.z[i], y: this.y[i], z: this.x[i], d: this.d[i] }); }
	dS__dc(a,b,c) { return this.iSum(this.dS_i__dc,a,b,c); }

	// second partial derivatives
	d2S_i__da2(i,a,b,c) { return this.EXPR.d2S_i__da2.eval({a: a, b: b, c: c, x: this.x[i], y: this.y[i], z: this.z[i], d: this.d[i] }); }
	d2S__da2(a,b,c) { return this.iSum(this.d2S_i__da2,a,b,c); }

	d2S_i__db2(i,a,b,c) { return this.EXPR.d2S_i__da2.eval({a: b, b: a, c: c, x: this.y[i], y: this.x[i], z: this.z[i], d: this.d[i] }); }
	d2S__db2(a,b,c) { return this.iSum(this.d2S_i__db2,a,b,c); }

	d2S_i__dc2(i,a,b,c) { return this.EXPR.d2S_i__da2.eval({a: c, b: b, c: a, x: this.z[i], y: this.y[i], z: this.x[i], d: this.d[i] }); }
	d2S__dc2(a,b,c) { return this.iSum(this.d2S_i__dc2,a,b,c); }


	d2S_i__dbda(i,a,b,c) { return this.EXPR.d2S_i__dbda.eval({a: a, b: b, c: c, x: this.x[i], y: this.y[i], z: this.z[i], d: this.d[i] }); }
	d2S__dbda(a,b,c) { return this.iSum(this.d2S_i__dbda,a,b,c); }

	d2S_i__dcda(i,a,b,c) { return this.EXPR.d2S_i__dbda.eval({a: a, b: c, c: b, x: this.x[i], y: this.z[i], z: this.y[i], d: this.d[i] }); }
	d2S__dcda(a,b,c) { return this.iSum(this.d2S_i__dcda,a,b,c); }

	d2S_i__dadb(i,a,b,c) { return this.EXPR.d2S_i__dbda.eval({a: b, b: a, c: c, x: this.y[i], y: this.x[i], z: this.z[i], d: this.d[i] }); }
	d2S__dadb(a,b,c) { return this.iSum(this.d2S_i__dadb,a,b,c); }

	d2S_i__dcdb(i,a,b,c) { return this.EXPR.d2S_i__dbda.eval({a: b, b: c, c: a, x: this.y[i], y: this.z[i], z: this.x[i], d: this.d[i] }); }
	d2S__dcdb(a,b,c) { return this.iSum(this.d2S_i__dcdb,a,b,c); }

	d2S_i__dadc(i,a,b,c) { return this.EXPR.d2S_i__dbda.eval({a: c, b: a, c: b, x: this.z[i], y: this.x[i], z: this.y[i], d: this.d[i] }); }
	d2S__dadc(a,b,c) { return this.iSum(this.d2S_i__dadc,a,b,c); }

	d2S_i__dbdc(i,a,b,c) { return this.EXPR.d2S_i__dbda.eval({a: c, b: b, c: a, x: this.z[i], y: this.y[i], z: this.x[i], d: this.d[i] }); }
	d2S__dbdc(a,b,c) { return this.iSum(this.d2S_i__dbdc,a,b,c); }

	// jacobian
	J_S(a,b,c) {
		return [
			[this.d2S__da2(a,b,c), this.d2S__dbda(a,b,c), this.d2S__dcda(a,b,c) ],
			[this.d2S__dadb(a,b,c), this.d2S__db2(a,b,c), this.d2S__dcdb(a,b,c) ],
			[this.d2S__dadc(a,b,c), this.d2S__dbdc(a,b,c), this.d2S__dc2(a,b,c) ]
		];
	}

}

export default MLTCartesian3D;