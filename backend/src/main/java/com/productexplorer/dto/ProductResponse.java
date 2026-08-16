package com.productexplorer.dto;

import java.util.List;

public record ProductResponse(
        String id,
        String name,
        String description,
        String category,
        String defaultColor,
        List<String> availableColors,
        List<ProductFeatureResponse> features
) {
}
