package com.productexplorer.mapper;

import com.productexplorer.dto.FeatureSpecificationResponse;
import com.productexplorer.dto.PositionResponse;
import com.productexplorer.dto.ProductFeatureResponse;
import com.productexplorer.dto.ProductResponse;
import com.productexplorer.entity.FeatureSpecificationEntity;
import com.productexplorer.entity.ProductColorEntity;
import com.productexplorer.entity.ProductEntity;
import com.productexplorer.entity.ProductFeatureEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProductMapper {

    public ProductResponse toResponse(ProductEntity product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                product.getDefaultColor(),
                product.getColors().stream().map(ProductColorEntity::getColorName).toList(),
                toFeatureResponses(product.getFeatures())
        );
    }

    public ProductFeatureResponse toResponse(ProductFeatureEntity feature) {
        return new ProductFeatureResponse(
                feature.getId(),
                feature.getName(),
                feature.getDescription(),
                feature.getCategory(),
                feature.getModelNodeName(),
                new PositionResponse(
                        feature.getPositionX(),
                        feature.getPositionY(),
                        feature.getPositionZ()
                ),
                new PositionResponse(
                        feature.getCameraX(),
                        feature.getCameraY(),
                        feature.getCameraZ()
                ),
                feature.getSpecifications().stream().map(this::toResponse).toList()
        );
    }

    public List<ProductFeatureResponse> toFeatureResponses(List<ProductFeatureEntity> features) {
        return features.stream().map(this::toResponse).toList();
    }

    private FeatureSpecificationResponse toResponse(FeatureSpecificationEntity specification) {
        return new FeatureSpecificationResponse(specification.getName(), specification.getValue());
    }
}
