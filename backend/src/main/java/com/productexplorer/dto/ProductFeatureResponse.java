package com.productexplorer.dto;

import java.util.List;

public record ProductFeatureResponse(
        String id,
        String name,
        String description,
        String category,
        String modelNodeName,
        PositionResponse position,
        PositionResponse cameraPosition,
        List<FeatureSpecificationResponse> specifications
) {
}
