import math from "mathjs";
import _ from 'lodash';
import MLTCartesian2D from "./MLTCartesian2D";

const METHOD_EQUIRECTANGULAR = 1;
const METHOD_LOWOFCOSINES = 2;
const R = 6371000;	//radius of earth in metres

function rad(_deg) {
	if(_.isNumber(_deg)) {
		return _deg * Math.PI / 180;
	} else if(_.isArray(_deg)) {
		return _.map(_deg, rad);
	} else {
		throw new Error('Can only convert numbers or arrays of numbers')
	}
}

function deg(_rad) {
	if(_.isNumber(_rad)) {
		return _rad * 180 / Math.PI;
	} else if(_.isArray(_rad)) {
		return _.map(_rad, deg);
	} else {
		throw new Error('Can only convert numbers or arrays of numbers')
	}

}

// Inject R into the mathjs space
math.import({
  R: R
});

class MLTGeo2D extends MLTCartesian2D {
	constructor(distMethod) {
		super();

		switch(distMethod="equirectangular") {
			case 'equirectangular':
				this.distMethod = METHOD_EQUIRECTANGULAR;
				break;
			case 'lawofcosines':
				this.distMethod = METHOD_LOWOFCOSINES;
				break;
			default:
				throw new Error('Unknown distance method');
		}
	}

	// adds an observation
	observe(latlon, dist) {
		// TODO data checking?
		this.x.push(rad(latlon[0]));
		this.y.push(rad(latlon[1]));
		this.d.push(dist);
		this.observations++;
	}

	// returns an estimation of the target point
	estimate(initial, iterations=5, verbose=false) {
		return deg(super.estimate(rad(initial), iterations, verbose));
	}

	// tells you the distance between two points
	dist(latlonA, latlonB) {
		let lat1 = rad(latlonA[0]), lon1 = rad(latlonA[1]), lat2 = rad(latlonB[0]), lon2 = rad(latlonB[1]);

		switch(this.distMethod) {
			case METHOD_EQUIRECTANGULAR:
				let x = (lon2-lon1)*Math.cos((lat1+lat2)/2);
				let y = (lat2-lat1);
				return Math.sqrt(x*x + y*y) * R;
			case METHOD_LOWOFCOSINES:
				return Math.acos( Math.sin(lat1)*Math.sin(lat2) + Math.cos(lat1)*Math.cos(lat2) * Math.cos(lon2-lon1) ) * R;
		}
	}

	// EXPRESSIONS
	initExpr() {
		if(this._initExprDone) {
			return;
		}
		this._initExprDone = true;

		// Geo2d distances
		// target point (a,b) sample point (x,y)
		// We could calculate the derivatives on the fly, but it turns out to be a lot slower
		switch(this.distMethod) {
			case METHOD_EQUIRECTANGULAR:
				this.EXPR = {
					S_i: math.compile("R^2*((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)-2*d*R*sqrt((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)+d^2"),
					dS_i__da: math.compile("-2*d*R*(-(y-b)^2*sin((x+a)/2)*cos((x+a)/2)/2+a-x)/sqrt((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)+R^2*(-(y-b)^2*sin((x+a)/2)cos((x+a)/2)+2*a-2*x)"),
					d2S_i__da2: math.compile("-2*d*R*(-(y-b)^2*sin((x+a)/2)cos((x+a)/2)/2+a-x)*((y-b)^2*sin((x+a)/2)cos((x+a)/2)/2+x-a)/((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)^(3/2)+d*R*((y-b)^2*(cos((x+a)/2))^2/2-(y-b)^2*(sin((x+a)/2))^2/2-2)/sqrt((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)+R^2*((y-b)^2*(sin((x+a)/2))^2/2-(y-b)^2*(cos((x+a)/2))^2/2+2)"),
					d2S_i__dbda: math.compile("-2*d*R*(y-b)*(cos((x+a)/2))^2*(-(y-b)^2*sin((x+a)/2)*cos((x+a)/2)/2+a-x)/((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)^(3/2)-2*d*R*(y-b)sin((x+a)/2)cos((x+a)/2)/sqrt((y-b)^2*(cos((x+a)/2))^2+(x-a)^2)+(2y-2b)R^2*sin((x+a)/2)cos((x+a)/2)")
				};
				break;
			case METHOD_LOWOFCOSINES:
				this.EXPR = {
					S_i: math.compile("(acos( sin(a)*sin(x) + cos(a)*cos(x) * cos(y-b) ) * R)^2 - 2*(acos( sin(a)*sin(x) + cos(a)*cos(x) * cos(y-b) ) * R)*d + d^2"),
					dS_i__da: math.compile("(-2*R^2*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))+2*d*R*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a)))/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)"),
					d2S_i__da2: math.compile("-2*R^2*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))^2/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)^(3/2)+2*d*R*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))^2/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)^(3/2)+2*R^2*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))^2/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)+2*R^2*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)-2*d*R*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)"),
					d2S_i__dbda: math.compile("-2*R^2*cos(a)cos(x)sin(y-b)*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)^(3/2)+2*d*R*cos(a)cos(x)sin(y-b)*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))*(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)^(3/2)+2*R^2*cos(a)cos(x)sin(y-b)*(-sin(a)cos(x)cos(y-b)+sin(x)cos(a))/(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)+2*R^2*sin(a)cos(x)sin(y-b)acos(cos(a)cos(x)cos(y-b)+sin(a)sin(x))/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)-2*d*R*sin(a)cos(x)sin(y-b)/sqrt(-(cos(a)cos(x)cos(y-b)+sin(a)sin(x))^2+1)")
				};
				break;
		}
	}

	rad(_deg) { return rad(_deg); }
	deg(_rad) { return deg(_rad); }

}

export default MLTGeo2D;