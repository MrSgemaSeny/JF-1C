# Stage 1: Build the application
FROM gradle:8.5-jdk17 AS builder
WORKDIR /app

# Copy gradle configuration files first to cache dependencies
COPY build.gradle settings.gradle /app/
COPY gradle /app/gradle
COPY gradlew /app/

# Download dependencies
RUN ./gradlew dependencies --no-daemon

# Copy the rest of the source code
COPY src /app/src

# Build the application
RUN ./gradlew bootJar --no-daemon -x test

# Stage 2: Create the runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
