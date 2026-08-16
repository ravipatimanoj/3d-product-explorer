package com.productexplorer.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_features")
@IdClass(ProductFeatureId.class)
public class ProductFeatureEntity {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Id
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private ProductEntity product;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", nullable = false, length = 64)
    private String category;

    @Column(name = "model_node_name", nullable = false, length = 128)
    private String modelNodeName;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "position_x", nullable = false)
    private Double positionX;

    @Column(name = "position_y", nullable = false)
    private Double positionY;

    @Column(name = "position_z", nullable = false)
    private Double positionZ;

    @Column(name = "camera_x", nullable = false)
    private Double cameraX;

    @Column(name = "camera_y", nullable = false)
    private Double cameraY;

    @Column(name = "camera_z", nullable = false)
    private Double cameraZ;

    @OneToMany(mappedBy = "feature", cascade = CascadeType.ALL, orphanRemoval = true)
    @Fetch(FetchMode.SUBSELECT)
    @OrderBy("sortOrder ASC")
    private List<FeatureSpecificationEntity> specifications = new ArrayList<>();

    public ProductFeatureEntity() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ProductEntity getProduct() {
        return product;
    }

    public void setProduct(ProductEntity product) {
        this.product = product;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getModelNodeName() {
        return modelNodeName;
    }

    public void setModelNodeName(String modelNodeName) {
        this.modelNodeName = modelNodeName;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public Double getPositionX() {
        return positionX;
    }

    public void setPositionX(Double positionX) {
        this.positionX = positionX;
    }

    public Double getPositionY() {
        return positionY;
    }

    public void setPositionY(Double positionY) {
        this.positionY = positionY;
    }

    public Double getPositionZ() {
        return positionZ;
    }

    public void setPositionZ(Double positionZ) {
        this.positionZ = positionZ;
    }

    public Double getCameraX() {
        return cameraX;
    }

    public void setCameraX(Double cameraX) {
        this.cameraX = cameraX;
    }

    public Double getCameraY() {
        return cameraY;
    }

    public void setCameraY(Double cameraY) {
        this.cameraY = cameraY;
    }

    public Double getCameraZ() {
        return cameraZ;
    }

    public void setCameraZ(Double cameraZ) {
        this.cameraZ = cameraZ;
    }

    public List<FeatureSpecificationEntity> getSpecifications() {
        return specifications;
    }

    public void setSpecifications(List<FeatureSpecificationEntity> specifications) {
        this.specifications = specifications;
    }
}
