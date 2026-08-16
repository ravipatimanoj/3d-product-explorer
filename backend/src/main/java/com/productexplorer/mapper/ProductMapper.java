package com.productexplorer.mapper;

import com.productexplorer.domain.FeatureSpecification;
import com.productexplorer.domain.Position;
import com.productexplorer.domain.Product;
import com.productexplorer.domain.ProductFeature;
import com.productexplorer.dto.FeatureSpecificationResponse;
import com.productexplorer.dto.PositionResponse;
import com.productexplorer.dto.ProductFeatureResponse;
import com.productexplorer.dto.ProductResponse;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProductMapper {

    public ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.id(),
                product.name(),
                product.description(),
                product.category(),
                product.defaultColor(),
                product.availableColors(),
                product.features().stream().map(this::toResponse).toList()
        );
    }

    public ProductFeatureResponse toResponse(ProductFeature feature) {
        return new ProductFeatureResponse(
                feature.id(),
                feature.name(),
                feature.description(),
                feature.category(),
                feature.modelNodeName(),
                toResponse(feature.position()),
                toResponse(feature.cameraPosition()),
                feature.specifications().stream().map(this::toResponse).toList()
        );
    }

    public List<ProductFeatureResponse> toFeatureResponses(List<ProductFeature> features) {
        return features.stream().map(this::toResponse).toList();
    }

    private PositionResponse toResponse(Position position) {
        return new PositionResponse(position.x(), position.y(), position.z());
    }

    private FeatureSpecificationResponse toResponse(FeatureSpecification specification) {
        return new FeatureSpecificationResponse(specification.name(), specification.value());
    }
}
