import math from "mathjs";
import _ from 'lodash';
import MLTGeo3D from "./MLTGeo3D";

const METHOD_ECEFTRANSFORM = 1;

class MLTGeo2D extends MLTGeo3D {
	constructor(distMethod) {
		super();
	}

	// adds an observation
	observe(latlon, dist) {
		// TODO data checking
		super.observe(latlon.concat(0), dist);
	}

	// returns an estimation of the target point
	estimate(iterations=5, verbose=false) {
		return _.take(super.estimate(iterations, verbose),2);
	}

	dist(latlonA, latlonB) {
		return super.dist(latlonA.concat(0), latlonB.concat(0));
	}
}

export default MLTGeo2D;