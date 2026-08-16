package com.productexplorer.entity;

import java.io.Serializable;
import java.util.Objects;

public class ProductFeatureId implements Serializable {

    private String product;
    private String id;

    public ProductFeatureId() {
    }

    public ProductFeatureId(String product, String id) {
        this.product = product;
        this.id = id;
    }

    public String getProduct() {
        return product;
    }

    public void setProduct(String product) {
        this.product = product;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    @Override
    public boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof ProductFeatureId that)) {
            return false;
        }
        return Objects.equals(product, that.product) && Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(product, id);
    }
}
