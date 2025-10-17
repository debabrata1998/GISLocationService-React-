package com.example.gis;

import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/places")
public class PlaceController {

	private final PlaceRepository placeRepository;
	private final GeometryFactory geometryFactory = new GeometryFactory();

	private static final int SRID_WGS84 = 4326;

	public PlaceController(PlaceRepository placeRepository) {
		this.placeRepository = placeRepository;
	}

	private Point createPoint(double longitude, double latitude) {
		Point point = geometryFactory.createPoint(new Coordinate(longitude, latitude));
		point.setSRID(SRID_WGS84);
		return point;
	}

	@PostMapping
	public ResponseEntity<?> addPlace(@RequestBody Map<String, Object> payload) {
		try {
			String name = (String) payload.get("name");
			String type = (String) payload.get("type");
			double lat = Double.parseDouble(payload.get("latitude").toString());
			double lon = Double.parseDouble(payload.get("longitude").toString());

			GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
			Point point = geometryFactory.createPoint(new Coordinate(lon, lat));

			Place place = new Place();
			place.setName(name);
			place.setType(type);
			place.setLocation(point);

			Place savedPlace = placeRepository.save(place);

			Map<String, Object> response = new HashMap<>();
			response.put("id", savedPlace.getId());
			response.put("name", savedPlace.getName());
			response.put("type", savedPlace.getType());
			response.put("lon", savedPlace.getLocation().getX());
			response.put("lat", savedPlace.getLocation().getY());

			return ResponseEntity.status(HttpStatus.CREATED).body(response);

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error adding place: " + e.getMessage());
		}
	}

	@GetMapping("/nearby")
	public List<Place> findNearby(@RequestParam double lat, @RequestParam double lon,
			@RequestParam double radiusMeters) {
		String wkt = String.format("POINT(%f %f)", lon, lat);
		return placeRepository.findNearbyPlaces(wkt, radiusMeters);
	}

	@GetMapping("/nearest")
	public ResponseEntity<Place> findNearest(@RequestParam double lat, @RequestParam double lon) {
	
		String wkt = String.format("POINT(%f %f)", lon, lat);

		Place nearestPlace = placeRepository.findNearestPlace(wkt);

		if (nearestPlace == null) {
			return new ResponseEntity<>(HttpStatus.NOT_FOUND);
		}
		return new ResponseEntity<>(nearestPlace, HttpStatus.OK);
	}

	@GetMapping("/distance")
	public ResponseEntity<Map<String, Double>> calculateDistance(@RequestParam double lat1, @RequestParam double lon1,
			@RequestParam double lat2, @RequestParam double lon2) {

		Point p1 = createPoint(lon1, lat1);
		Point p2 = createPoint(lon2, lat2);

		final int R = 6371; // Radius of earth in km
		double dLat = Math.toRadians(lat2 - lat1);
		double dLon = Math.toRadians(lon2 - lon1);
		double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(Math.toRadians(lat1))
				* Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		double distanceInKm = R * c;

		Map<String, Double> result = new HashMap<>();
		result.put("distance_km", distanceInKm);
		result.put("distance_m", distanceInKm * 1000);

		return new ResponseEntity<>(result, HttpStatus.OK);
	}
}