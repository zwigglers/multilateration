/**
 * - type -- coordinate type
 * 		- 2d-cartesian [x,y]
 * 		- 3d-cartesian [x,y,z]
 * 		- 2d-geo [lat,lon]
 * 		- 3d-geo [lat,lon,lat]
 * 	- distanceMethod
 * 		- type=2d-geo
 * 			- equirectangular (default)
 * 		 	- lawofcosines
 * 		- type=3d-geo
 * 			- eceftransform (default)
 */

import MLTCartesian2D from "../lib/MLTCartesian2D";
import MLTCartesian3D from "../lib/MLTCartesian3D";
import MLTGeo2D from "../lib/MLTGeo2D";
import MLTGeo3D from "../lib/MLTGeo3D";

export default function(type, distanceMethod=null) {
	switch(type) {
		case '2d-cartesian':
			return new MLTCartesian2D(distanceMethod);
		case '2d-geo':
			return new MLTGeo2D(distanceMethod);
		case '3d-cartesian':
			return new MLTCartesian3D(distanceMethod);
		case '3d-geo':
			return new MLTGeo3D(distanceMethod);
	}
};