package com.example.zhanfinancebackend.modules.services.entity;

import com.example.zhanfinancebackend.common.audit.BaseEntity;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "services")
public class ServiceEntity extends BaseEntity {

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String price;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "is_highlighted", nullable = false)
    private Boolean isHighlighted = false;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "service_features",
            joinColumns = @JoinColumn(name = "service_id")
    )
    @Column(name = "feature")
    private List<String> features = new ArrayList<>();

    public ServiceEntity() {}

    public ServiceEntity(String title, String description) {
        this.title = title;
        this.description = description;
    }

    // ========== Getters & Setters ==========

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPrice() { return price; }
    public void setPrice(String price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsHighlighted() { return isHighlighted; }
    public void setIsHighlighted(Boolean highlighted) { isHighlighted = highlighted; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }

    public List<String> getFeatures() { return features; }
    public void setFeatures(List<String> features) { this.features = features; }
}
