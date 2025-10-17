package com.example.gis;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.locationtech.jts.geom.Point;

import javax.persistence.*;

@Entity
@Table(name = "places")
public class Place {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;

    @Column(columnDefinition = "geometry(Point,4326)")
    @JsonIgnore
    private Point location;

 
    @JsonProperty("latitude")
    public Double getLatitude() {
        return location != null ? location.getY() : null;
    }

    @JsonProperty("longitude")
    public Double getLongitude() {
        return location != null ? location.getX() : null;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Point getLocation() { return location; }
    public void setLocation(Point location) { this.location = location; }
}
