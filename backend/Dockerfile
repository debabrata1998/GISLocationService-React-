# Stage 1: Build the application using Maven and Java 8
FROM maven:3.8.8-eclipse-temurin-8 AS build
WORKDIR /app

# Copy the Maven build definition (pom.xml) and the source code
COPY pom.xml .
COPY src src

# Run the Maven build to create the JAR
RUN mvn clean package -DskipTests

# Stage 2: Create a lightweight runtime image using OpenJDK 8
FROM openjdk:8-jdk-alpine
WORKDIR /app

# Copy the packaged JAR file from the build stage
COPY --from=build /app/target/gis-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
