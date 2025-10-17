package com.example.gis;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaceRepository extends JpaRepository<Place, Long> {

	@Query(value = "SELECT * FROM places "
			+ "WHERE ST_DWithin(CAST(location AS geography), ST_SetSRID(ST_GeomFromText(:wkt), 4326), :radiusInMeters)", nativeQuery = true)
	List<Place> findNearbyPlaces(@Param("wkt") String wkt, @Param("radiusInMeters") double radiusInMeters);

	@Query(value = "SELECT p.*, ST_Distance(CAST(p.location AS geography), ST_SetSRID(ST_GeomFromText(:wkt), 4326)) AS distance "
			+ "FROM places p " + "ORDER BY distance ASC " + "LIMIT 1", nativeQuery = true)
	Place findNearestPlace(@Param("wkt") String wkt);

}