package com.productexplorer.domain;

import java.util.List;

public record ProductFeature(
        String id,
        String name,
        String description,
        String category,
        String modelNodeName,
        Position position,
        Position cameraPosition,
        List<FeatureSpecification> specifications
) {
}
