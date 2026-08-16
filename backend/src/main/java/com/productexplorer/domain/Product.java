package com.productexplorer.domain;

import java.util.List;

public record Product(
        String id,
        String name,
        String description,
        String category,
        String defaultColor,
        List<String> availableColors,
        List<ProductFeature> features
) {
}
