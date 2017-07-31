import math from "mathjs";
import projector from 'ecef-projector';

import MLTCartesian3D from './MLTCartesian3D';

function lla(_ecef) {
	return projector.unproject(_ecef[0],_ecef[1],_ecef[2]);
}

function ecef(_lla) {
	return projector.project(_lla[0],_lla[1],_lla[2]);
}

const METHOD_ECEFTRANSFORM = 1;

class MLTGeo3D extends MLTCartesian3D {
	constructor(distMethod) {
		super();

		switch(distMethod="eceftransform") {
			case 'eceftransform':
				this.distMethod = METHOD_ECEFTRANSFORM;
				break;
			default:
				throw new Error('Unknown distance method');
		}
	}

	// adds an observation
	observe(_lla, dist) {
		// TODO data checking?
		super.observe(ecef(_lla), dist);
	}

	// returns an estimation of the target point
	estimate(initial, iterations=5, verbose=false) {
		// TODO data checking?

		return lla(super.estimate(ecef(initial), iterations, verbose));
	}

	dist(_llaA, _llaB) {
		switch(this.distMethod) {
			case METHOD_ECEFTRANSFORM:
				return super.dist(ecef(_llaA), ecef(_llaB));
				break;
		}
	}

	lla(_ecef) { return lla(_ecef); }
	ecef(_lla) { return ecef(_lla); }
}

export default MLTGeo3D;