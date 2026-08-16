package com.productexplorer.repository;

import com.productexplorer.entity.ProductFeatureEntity;
import com.productexplorer.entity.ProductFeatureId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductFeatureRepository extends JpaRepository<ProductFeatureEntity, ProductFeatureId> {

    Optional<ProductFeatureEntity> findByProduct_IdAndId(String productId, String id);

    List<ProductFeatureEntity> findByProduct_IdOrderBySortOrderAsc(String productId);
}
