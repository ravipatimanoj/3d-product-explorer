package com.productexplorer.service;

import com.productexplorer.domain.Product;
import com.productexplorer.domain.ProductFeature;
import com.productexplorer.dto.ProductFeatureResponse;
import com.productexplorer.dto.ProductResponse;
import com.productexplorer.exception.ResourceNotFoundException;
import com.productexplorer.mapper.ProductMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private final Map<String, Product> productsById;
    private final ProductMapper productMapper;

    public ProductService(ProductMapper productMapper) {
        this.productMapper = productMapper;
        this.productsById = ProductCatalog.createInitialCatalog().stream()
                .collect(Collectors.toMap(Product::id, Function.identity()));
    }

    public List<ProductResponse> getAllProducts() {
        return productsById.values().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    public ProductResponse getProductById(String id) {
        Product product = findProduct(id);
        return productMapper.toResponse(product);
    }

    public List<ProductFeatureResponse> getFeatures(String productId) {
        Product product = findProduct(productId);
        return productMapper.toFeatureResponses(product.features());
    }

    public ProductFeatureResponse getFeatureById(String productId, String featureId) {
        Product product = findProduct(productId);
        return product.features().stream()
                .filter(feature -> feature.id().equals(featureId))
                .findFirst()
                .map(productMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Feature not found: " + featureId + " for product: " + productId));
    }

    private Product findProduct(String id) {
        Product product = productsById.get(id);
        if (product == null) {
            throw new ResourceNotFoundException("Product not found: " + id);
        }
        return product;
    }
}
